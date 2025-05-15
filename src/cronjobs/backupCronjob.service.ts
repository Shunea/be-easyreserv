import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';

dotenv.config();

@Injectable()
export class BackupCronjobService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(BackupCronjobService.name);
  }

  @Cron('0 0 * * *')
  async createBackup() {
    const backupFileName = `backup-${moment().format('YYYYMMDDHHmmss')}.sql`;
    const backupFolderPath = 'src/backup';
    const backupFilePath = `${backupFolderPath}/${backupFileName}`;

    if (!fs.existsSync(backupFolderPath)) {
      fs.mkdirSync(backupFolderPath);
    }

    const backupCommand = `mysqldump -u ${process.env.DB_USERNAME} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupFilePath}`;

    exec(backupCommand, (error) => {
      if (error) {
        this.logger.error(`Error creating backup: ${error}`);
        return;
      }

      this.logger.log(`Backup created successfully: ${backupFileName}`);
    });

    this.deleteOldBackups();
  }

  async deleteOldBackups() {
    const backupDir = 'src/backup';
    const files = await fs.promises.readdir(backupDir);

    files.forEach(async (file) => {
      const filePath = `${backupDir}/${file}`;
      const fileStat = await fs.promises.stat(filePath);
      const fileAgeDays = moment().diff(moment(fileStat.mtime), 'days');

      if (fileStat.isFile() && fileAgeDays >= 7) {
        try {
          await fs.promises.unlink(filePath);
          this.logger.log(`${file} was successfully deleted`);
        } catch (error) {
          this.logger.error(`Error deleting backup: ${error}`);
        }
      }
    });
  }
}
