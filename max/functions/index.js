const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {initializeApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {getMessaging} = require('firebase-admin/messaging');
initializeApp();
exports.announceEvent = onCall({region:'europe-west1',maxInstances:3},async (req)=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Inloggen verplicht.');
 const db=getFirestore();
 const role=await db.doc(`roles/${req.auth.uid}`).get();
 if(!role.exists||role.data().role!=='admin')throw new HttpsError('permission-denied','Alleen beheerders.');
 const items=await db.collection('events').get();
 const next=items.docs.map(x=>x.data()).filter(e=>e.published===true&&Date.parse(e.date)>Date.now()).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))[0];
 if(!next)throw new HttpsError('failed-precondition','Geen toekomstige gepubliceerde uitzending.');
 const subs=await db.collection('pushSubscriptions').get();const tokens=[...new Set(subs.docs.map(d=>d.data().token).filter(Boolean))];let sent=0,failed=0;
 for(let i=0;i<tokens.length;i+=500){const batch=tokens.slice(i,i+500);const r=await getMessaging().sendEachForMulticast({tokens:batch,notification:{title:'MAX HITRADIO',body:`Binnenkort: ${String(next.title||'speciale uitzending').slice(0,120)}`},webpush:{fcmOptions:{link:'https://thegamerscube.nl/max/#events'}}});sent+=r.successCount;failed+=r.failureCount}
 return {sent,failed};
});
