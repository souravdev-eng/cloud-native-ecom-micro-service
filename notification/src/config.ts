class Config {
  public NODE_ENV: string | undefined;
  public RABBITMQ_ENDPOINT: string | undefined;
  public EMAIL_USER: string | undefined;
  public EMAIL_APP_PASSWORD: string | undefined;

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.EMAIL_USER = process.env.EMAIL_USER || '';
    this.EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';
  }
}

export const config: Config = new Config();
