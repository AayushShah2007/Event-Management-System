import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    if (!resend) return NextResponse.json({ error: "Resend not configured" }, { status: 500 });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await resend.emails.send({
      from: "EventPass <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP for Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a2e, #c0392b); padding: 32px 24px 24px; text-align: center;">
            <table style="margin: 0 auto 10px;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 56px; height: 56px; background: white; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 0;">
                  <span style="font-size: 22px; font-weight: 900; color: #c0392b; line-height: 56px; display: block;">EP</span>
                </td>
              </tr>
            </table>
            <h1 style="color: white; font-size: 22px; margin: 0; font-weight: 700;">EventPass</h1>
          </div>
          <div style="padding: 32px 24px; background: #12121e;">
            <h2 style="color: #f5f5f5; font-size: 18px; margin: 0 0 8px; font-weight: 600;">Email Verification</h2>
            <p style="color: #aaa; font-size: 14px; margin: 0 0 20px;">Your One-Time Password (OTP) is:</p>
            <div style="background: #1e1e30; padding: 20px; text-align: center; border-radius: 8px; margin: 0 0 20px; border: 1px solid #2a2a40;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4a017;">${otp}</span>
            </div>
            <p style="color: #888; font-size: 13px; margin: 0;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
          </div>
          <div style="background: #0e0e1a; padding: 16px 24px; text-align: center;">
            <p style="color: #ccc; font-size: 11px; margin: 0;">If you did not request this OTP, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ otp });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    const message = error?.message || "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
