export const EmailFooter = () => {
  return `
    <!-- Footer Logo and Text -->
    <table align="center" style="width:650px; border-spacing:0; border-collapse:collapse; margin:24px auto; padding:0;">
      <tbody>
        <tr>
          <td valign="top" align="center" style="width:560px;">
            <a href="${process.env.BASE_URL}" target="_blank">
              <img src="${process.env.NEXTAUTH_URL}/assets/img/logo.png" width="200" alt="Swipped Logo" style="border:0; max-width: 20%;">
            </a>
              Connect with customers and grow your service business with <strong>Swipped</strong>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
};
