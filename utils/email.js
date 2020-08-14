const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const path = require('path'); // for joining paths

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mukesh Singh <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send the actual email
  async send(template, subject) {
    // 1) Render the html for the email based on a pug template

    const path1 = path.join(__dirname, `/../views/emails/${template}.pug`);
    // take a pug file and render it to a html file
    const html = pug.renderFile(path1, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

// const sendEmail = async (options) => {
//   // 1) Create a transporter(means service that will send the email)
//   const transporter = nodemailer.createTransport({
//     //--------------------Using gmail/somePreconfigured service (comes preconfigured with nodejs)
//     // service: 'Gmail',
//     // auth: {
//     //   user: process.env.EMAIL_USERNAME,
//     //   pass: process.env.EMAIL_PASSWORD,
//     // },
//     // // avtivate in gmail "less secure app" option

//     // --------- production app do not use gmail as we can only send upto 500 emails from there.
//     // Using DEVELOPMENT service -- mailtrap
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2) Define email options
//   const mailOptions = {
//     from: 'Mukesh Singh <mukesh@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //   html:
//   };

//   // 3) Send the email with nodemailer
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
