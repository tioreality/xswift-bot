import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger';
import { config } from './config';

export interface SlashCommand {
  data: { name: string; toJSON(): object };
  execute: (interaction: any) => Promise<void>;
  autocomplete?: (interaction: any) => Promise<void>;
}

export class XSwiftClient extends Client {
  public commands: Collection<string, SlashCommand> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });
  }

  async initialize(): Promise<void> {
    await this.loadCommands();
    await this.loadEvents();
    await this.login(config.discord.token);
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = join(__dirname, 'commands');
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      try {
        const commandFiles = readdirSync(folderPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
        for (const file of commandFiles) {
          const filePath = join(folderPath, file);
          const command = require(filePath);
          const cmd = command.default || command;
          if (cmd?.data && cmd?.execute) {
            this.commands.set(cmd.data.name, cmd);
            logger.debug(`Loaded command: ${cmd.data.name}`);
          }
        }
      } catch (e) {
        logger.warn(`Could not load commands from ${folder}: ${e}`);
      }
    }
    logger.info(`Loaded ${this.commands.size} commands`);
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = join(__dirname, 'events');
    try {
      const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
      for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        const event = require(filePath);
        const ev = event.default || event;
        if (ev?.name && ev?.execute) {
          if (ev.once) {
            this.once(ev.name, (...args) => ev.execute(...args, this));
          } else {
            this.on(ev.name, (...args) => ev.execute(...args, this));
          }
          logger.debug(`Loaded event: ${ev.name}`);
        }
      }
    } catch (e) {
      logger.warn(`Could not load events: ${e}`);
    }
  }
}
