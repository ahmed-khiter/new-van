import { EmailContentWrapper } from "./EmailContentWrapper";
import { EmailFooter } from "./EmailFooter";
import { EmailHeader } from "./EmailHeader";

// Define the EmailTemplate function
export const EmailTemplate = ({ content, subject }) => {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="UTF-8">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="telephone=no" name="format-detection">
        <title>${subject}</title>
        <style type="text/css">
          body {
            background-color:#F5F9FF;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body style="margin:0;padding:0;width:100%;">
        <div>
          ${EmailHeader(subject)}
          ${EmailContentWrapper(content)}
        </div>
      </body>
    </html>
  `;
};
