/** @type {import('next').NextConfig} */
const config={
 serverExternalPackages:['sharp'],
 // Netlify build context is public configuration, not a credential.
 env:{EV_PHOTO_SCOPE:process.env.CONTEXT==='production'?'production':(process.env.DEPLOY_ID||'local')},
};
export default config;
