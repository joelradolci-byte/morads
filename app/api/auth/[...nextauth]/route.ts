import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
      // 🚀 EL SECRETO DEL FUTURO: 
      // Cuando Google te apruebe la API de Ads, simplemente vamos a descomentar 
      // estas líneas de abajo. Eso hará que, al iniciar sesión, el usuario también 
      // te dé permiso para leer sus campañas. Por ahora, solo pedimos su email.
      
      // authorization: {
      //   params: {
      //     scope: "openid email profile https://www.googleapis.com/auth/adwords",
      //   },
      // },
    }),
  ],
});

export { handler as GET, handler as POST };