export const EmailHeader = () => {
    return `
    <table style="width:100%;">
      <tbody>
        <tr>
          <td valign="top">
            <table class="es-header" align="center" style="width:100%;">
              <tbody>
                <tr>
                  <td align="center">
                    <table class="es-header-body" style="width:600px;">
                      <tbody>
                        <tr>
                          <td align="left" style="padding:10px;">
                            <table style="width:100%;">
                              <tbody>
                                <tr>
                                  <td valign="top" align="center" style="width:560px;">
                                    <a href="${process.env.NEXTAUTH_URL}" target="_blank">
                                      <img src="${process.env.NEXTAUTH_URL}/assets/img/logo.png" width="200" alt="Swipped Logo" style="border:0; max-width: 20%;">
                                    </a>
                                    <p style="word-break: break-word; font-size: 20px; color: #B1AED1; margin-top:0px; margin-bottom:0px;">
                                      <strong>Swipped</strong> – Provide Services & Connect with Customers!
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
};
