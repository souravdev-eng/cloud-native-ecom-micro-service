class Config {
    public NODE_ENV: string | undefined;
    public DB_URL: string | undefined;
    public RABBITMQ_ENDPOINT: string | undefined;
    public EMAIL_USER: string | undefined;
    public EMAIL_APP_PASSWORD: string | undefined;
    public AUTH_SERVICE_MONGODB_URL: string | undefined;
    public AUTH_SERVICE_MONGODB_PASSWORD: string | undefined;
    public AUTH_SERVICE_MONGODB_USER: string | undefined;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.DB_URL = process.env.DB_URL || '';
        this.AUTH_SERVICE_MONGODB_USER =
            process.env.AUTH_SERVICE_MONGODB_USER || '';
        this.AUTH_SERVICE_MONGODB_URL =
            process.env.AUTH_SERVICE_MONGODB_URL || '';
        this.AUTH_SERVICE_MONGODB_PASSWORD =
            process.env.AUTH_SERVICE_MONGODB_PASSWORD || '';
        this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
        this.EMAIL_USER = process.env.EMAIL_USER || '';
        this.EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';
    }
}

export const config: Config = new Config();
