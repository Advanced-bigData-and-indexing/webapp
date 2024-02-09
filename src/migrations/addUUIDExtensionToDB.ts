import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUuidToUser1707291463114 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: Dropping the extension might not be desired if other tables use it
        await queryRunner.query(`DROP EXTENSION "uuid-ossp"`);
    }

}
