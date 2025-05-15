export class SentenceBuilder {
  static buildHelloSentence(firstName: string): string {
    return `Salut ${firstName}, bun venit în botul EasyReservBot. 
Aici vei primi mesage referitor la comenzile plasate de clienţii dumneavoastră.`;
  }

  static orderMessage(
    restaurantName: string,
    streetAddress: string,
    suplierName: string,
    productTitle: string,
    productVolume: number,
    restaurantEmail: string,
    additionalMessage: string,
  ) {
    return `Solicitare din parte ${restaurantName},
Aflat pe strada ${streetAddress}.

Salut ${suplierName},
Solicităm: 

  - ${productTitle}, în cantitate de ${productVolume} KILOGRAME/LITRI/UNITĂŢI.

Vă rugăm să ne furnizați detaliile ofertei de preţ la poşta electronică: 
${restaurantEmail}

Mesaj adiţional: ${additionalMessage || ''}`;
  }
}
