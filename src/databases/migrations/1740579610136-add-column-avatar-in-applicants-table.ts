import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnAvatarInApplicantsTable1740579610136
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('Alter table applicants ADD avatar varchar(255)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('Alter table applicants DROP COLUMN avatar');
  }
}
