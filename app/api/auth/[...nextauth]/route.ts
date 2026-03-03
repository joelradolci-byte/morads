import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
      authorization: {
        params: {
          // ESTO ES LO NUEVO: Obliga a Google a mostrar la pantalla de selección de cuenta
          prompt: "select_account", 
          
          // 🚀 EL SECRETO DEL FUTURO: 
          // Cuando Google te apruebe la API de Ads, simplemente descomentá la línea de scope. 
          // Eso hará que, al iniciar sesión, el usuario también te dé permiso para leer sus campañas.
          // scope: "openid email profile https://www.googleapis.com/auth/adwords",
        },
      },
    }),
  ],
});

export { handler as GET, handler as POST };