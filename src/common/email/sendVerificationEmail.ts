import * as dotenv from 'dotenv';
import * as moment from 'moment';
import gre from '../globalRegEx';
import { EMAIL_TEMPLATES } from '@src/constants';
import { I18nContext } from 'nestjs-i18n';

dotenv.config();

const { htmlToText } = require('html-to-text');

async function getTemplate(options: any, i18n: any, request: any) {
  const { token, username, temporaryPassword } = options;

  let template = request.isMobileDevice
    ? EMAIL_TEMPLATES.verificationMobileEmail
    : EMAIL_TEMPLATES.verificationWebEmail;

  template = template.replace(
    gre(`{dear}`),
    i18n.t('translation.dear', { args: { username } }),
  );
  template = template.replace(
    gre(`{thankYouForSigning}`),
    i18n.t('translation.thankYouForSigning'),
  );
  template = template.replace(
    gre(`{temporaryPassword}`),
    temporaryPassword
      ? i18n.t('translation.temporaryPassword', {
          args: { temporaryPassword },
        })
      : '',
  );
  template = template.replace(
    gre(`{pleaseChangePasswordAsSoon}`),
    temporaryPassword ? i18n.t('translation.pleaseChangePasswordAsSoon') : '',
  );
  template = template.replace(
    gre('{ignoreThisVerificationEmail}'),
    i18n.t('translation.ignoreThisVerificationEmail'),
  );
  template = template.replace(
    gre('{yourVerificationCodeText}'),
    request.isMobileDevice
      ? i18n.t('translation.yourVerificationCodeText')
      : '',
  );
  template = template.replace(
    gre('{yourVerificationCodeToken}'),
    request.isMobileDevice ? token : '',
  );
  template = template.replace(
    gre('{clickOnTheButtonBelowToVerifyEmail}'),
    !request.isMobileDevice
      ? i18n.t('translation.clickOnTheButtonBelowToVerifyEmail')
      : '',
  );
  template = template.replace(
    gre('{verifyYourEmail}'),
    !request.isMobileDevice ? i18n.t('translation.verifyYourEmail') : '',
  );
  template = template.replace(
    gre('{pleaseUseThisLink}'),
    !request.isMobileDevice ? i18n.t('translation.pleaseUseThisLink') : '',
  );
  template = template.replace(
    gre('{verification_link}'),
    !request.isMobileDevice
      ? `${process.env.DASHBOARD_URL}/email-verification/${token}`
      : '',
  );
  template = template.replace(gre('{regards}'), i18n.t('translation.regards'));
  template = template.replace(
    gre('{yourFriendsAtEasyReserv}'),
    i18n.t('translation.yourFriendsAtEasyReserv'),
  );
  template = template.replace(
    gre('{easyreserv_logo}'),
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

function requestOptions(options) {
  return {
    to: options.to,
    from: `EasyReserv <${fromEmail(options)}>`,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
}

function createRequest(options) {
  const request = requestOptions(options);

  const emailRequest = options.replyTo
    ? {
        ...request,
        replyTo: options.replyTo,
      }
    : request;

  return emailRequest;
}

async function sendVerificationEmail(
  body: any,
  i18n: I18nContext,
  request: any,
) {
  const { email: to, token, username, temporaryPassword } = body;

  const template = await getTemplate(
    { token, username, temporaryPassword },
    i18n,
    request,
  );

  const options = {
    to,
    html: template.html,
    text: template.text,
    subject: i18n.t('translation.emailVerification'),
  };

  const data = createRequest(options);

  return data;
}

export default sendVerificationEmail;
