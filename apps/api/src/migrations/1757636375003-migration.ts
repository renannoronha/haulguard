import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1757636375003 implements MigrationInterface {
    name = 'Migration1757636375003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "status" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "driver" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "license_number" character varying(50) NOT NULL, "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_7c5a3b84b7b00792f1eb06cd916" UNIQUE ("license_number"), CONSTRAINT "PK_61de71a8d217d585ecd5ee3d065" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "driver_id" integer NOT NULL, "load_id" integer NOT NULL, "status" integer NOT NULL DEFAULT '0', "assigned_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "load" ("id" SERIAL NOT NULL, "origin" character varying(255) NOT NULL, "destination" character varying(255) NOT NULL, "cargo_type" character varying(100) NOT NULL, "status" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_296e0b3de93140af614a57b186b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_455611cee404eb67fbd863a4ad8" FOREIGN KEY ("driver_id") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_d793f4b973dbea4f45d2792b3b2" FOREIGN KEY ("load_id") REFERENCES "load"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_d793f4b973dbea4f45d2792b3b2"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_455611cee404eb67fbd863a4ad8"`);
        await queryRunner.query(`DROP TABLE "load"`);
        await queryRunner.query(`DROP TABLE "assignment"`);
        await queryRunner.query(`DROP TABLE "driver"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
