export function InviteEmail({
  name,
  familyName,
  inviteUrl,
}: {
  name: string;
  familyName: string;
  inviteUrl: string;
}) {
  return `
    <div style="font-family: Arial; line-height: 1.6;">
      <h2>You've been invited to join ${familyName} on Family First 👨‍👩‍👧‍👦</h2>
      <p>Hello ${name},</p>
      <p>You’ve been added to the ${familyName} family tree.</p>
      <p>Click the button below to create your account and complete your profile.</p>
      <p>
        <a href="${inviteUrl}" 
           style="padding: 12px 24px; background: #4a8af4; color: white; 
           border-radius: 6px; text-decoration: none;">
          Accept Invitation
        </a>
      </p>
      <p>If the button doesn’t work, copy this link:</p>
      <p>${inviteUrl}</p>
      <br/>
      <p>Family First</p>
    </div>
  `;
}
