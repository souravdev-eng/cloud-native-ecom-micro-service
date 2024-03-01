class Config {
    public NODE_ENV: string | undefined;
    public DB_URL: string | undefined;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.DB_URL = process.env.DB_URL || '';
    }
}

export const config: Config = new Config()