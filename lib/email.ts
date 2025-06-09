import nodemailer from "nodemailer";
 
 const EmailTemplate = (email: string , password : string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Welcome to Our Service</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Reset styles */
      body, table, td, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }

      /* Responsive styles */
      @media screen and (max-width: 600px) {
        .main-container {
          width: 100% !important;
          padding: 20px !important;
        }
        .button {
          width: 100% !important;
        }
      }

      /* Base styles */
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      }
      .main-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        border-radius: 8px;
      }
      h1 {
        color: #333333;
        font-size: 24px;
        margin-bottom: 20px;
      }
      p {
        color: #555555;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 30px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #4184F0;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
      }
      .footer {
        text-align: center;
        color: #999999;
        font-size: 12px;
        margin-top: 40px;
      }
    </style>
  </head>
  <body>
    <div class="main-container">
      <h1>Welcome to Our Service!</h1>
      <p>We're excited to have you on board. To get started, please create your employee account by clicking the button below:</p>
      <p style="text-align: center;">
        <div> <h1> Email </h1> : ${ email}</div>
        <div> <h1> Password </h1> : ${ password}</div>
      </p>
      <p>If you have any questions, feel free to reply to this email. We're here to help!</p>
      <div class="footer">
        © ${new Date().getFullYear()} Imprest Ltd. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export default async function sendEmail(email: string, password: string) {
  // Create a transporter using your email provider settings
  const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'gmail' or use "host", "port", and "secure" for SMTP
    auth: {
      user: process.env.EMAIL_USERNAME, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email app password
    },
  });
  // Compose email
  const mailOptions = {
    from: `"Impreset" <${process.env.EMAIL_USERNAME}>`, // sender address
    to: email, // recipient
    subject: "Credential", // email subject
    html: EmailTemplate(
      email, password
    ), // HTML email body
  };

  // Send email
  try {
  const data =   await transporter.sendMail(mailOptions);
  console.log(data)
    return true;
  } catch (error) {
    console.error("Failed to send email:❌", error);
    return false;
  }
}
