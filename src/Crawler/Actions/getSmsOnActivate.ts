import { Page } from 'puppeteer';

export const getSmsOnActivate = async (page: Page, options: {email: string, password: string}) => {
  await page.goto("https://sms-activate.ru/en/");
  await page.click(".bs-example-modal-lg");
  await page.type(".form-control[name='email']", options.email);
  await page.type(".form-control[name='pass']", options.password);
}
