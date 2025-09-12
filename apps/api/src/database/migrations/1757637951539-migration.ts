import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1757637951539 implements MigrationInterface {
    name = 'Migration1757637951539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_unique_active_assignment" ON "assignment" ("driver_id", "status") WHERE status = 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_unique_active_assignment"`);
    }

}
