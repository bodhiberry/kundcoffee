import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"XolaCloud" <${process.env.ZOHO_EMAIL}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
    return { data: info, error: null };
  } catch (error) {
    console.error("Error sending email via Zoho:", error);
    return { data: null, error };
  }
};
