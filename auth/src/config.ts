class Config {
    public NODE_ENV: string | undefined;
    public DB_URL: string | undefined;
    public RABBITMQ_ENDPOINT: string | undefined;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.DB_URL = process.env.DB_URL || '';
        this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    }
}

export const config: Config = new Config()