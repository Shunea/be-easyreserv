import { I18nContext } from 'nestjs-i18n';

function fromEmail(options: any): string {
  return options && options.from ? options.from : process.env.SUPPORT_EMAIL;
}

function requestOptions(options: any) {
  return {
    to: options.to,
    from: `User Report Email ${fromEmail(options)}`,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
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

async function sendSupportEmail(body: any) {
  const { email: to, reply: replyTo, message, title } = body;

  const options = {
    to,
    replyTo,
    subject: title,
    text: message,
  };

  const data = createRequest(options);

  return data;
}

export default sendSupportEmail;
