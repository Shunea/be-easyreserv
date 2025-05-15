import * as dotenv from 'dotenv';
import * as moment from 'moment';
import gre from '../globalRegEx';
import { EMAIL_TEMPLATES } from '@src/constants';
import { I18nContext } from 'nestjs-i18n';

dotenv.config();

const { htmlToText } = require('html-to-text');

async function getTemplate(options: any, i18n: any) {
  const {
    suplierName,
    adminName,
    restaurantName,
    productLines,
    additionalProperties,
    suplierEmail,
  } = options;

  let template = EMAIL_TEMPLATES.suplierRequestTemplate;

  template = template.replace(`{suplierName}`, suplierName);
  template = template.replace(`{adminName}`, adminName);
  template = template.replace(`{restaurantName}`, restaurantName);
  template = template.replace(`{productLines`, productLines);
  template = template.replace(`{additionalProperties}`, additionalProperties);
  template = template.replace(`{suplierEmail}`, suplierEmail);
  template = template.replace(
    gre(`{easyreserv_logo}`),
    `${process.env.AWS_STATIC_URL}/images/93c9b253-47b6-4fd5-a7d2-7dbe5837438b.png`,
  );
  template = template.replace(
    gre('{allRightsReserved}'),
    i18n.t('translation.allRightsReserved'),
  );
  template = template.replace(gre('{currentYear}'), moment().year());

  const text = htmlToText(template);
  return { html: template, text };
}

function fromEmail(options: any): string {
  return options && options.from ? options.from : process.env.SMTP_USERNAME;
}

function requestOptions(options: any) {
  return {
    to: options.to,
    from: `Suplier Solicitation <${fromEmail(options)}>`,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
}

function createRequest(options: any) {
  const request = requestOptions(options);

  const emailRequest = options.replyTo
    ? {
        ...request,
        replyTo: options.replyTo,
      }
    : request;

  return emailRequest;
}

async function sendSuplierTemplate(body: any, i18n: I18nContext) {
  const {
    email: to,
    suplierName,
    adminName,
    restaurantName,
    productLines,
    additionalProperties,
    suplierEmail,
  } = body;

  const template = await getTemplate(
    {
      suplierName,
      adminName,
      restaurantName,
      productLines,
      additionalProperties,
      suplierEmail,
    },
    i18n,
  );

  const options = {
    to,
    html: template.html,
    text: template.text,
    subject: 'Suplier Solicitation',
  };

  const data = createRequest(options);

  return data;
}

export default sendSuplierTemplate;
