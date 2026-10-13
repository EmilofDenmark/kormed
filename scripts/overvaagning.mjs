// Automatisk kontrol af det live site. Kører hver nat via GitHub Actions
// (.github/workflows/overvaagning.yml) og kan køres manuelt:
//   node scripts/overvaagning.mjs [https://adresse]
// Afslutter med fejlkode 1 (og GitHub sender dig en mail), hvis noget er galt.

const BASE = process.argv[2] || process.env.SITE_URL || 'https://xn--krmed-vua.dk'
const WWW = BASE.replace('https://', 'https://www.')

const problems = []
const ok = []
const fail = (msg) => problems.push(msg)

async function get(path, opts = {}) {
  return fetch(BASE + path, { redirect: 'manual', ...opts })
}

async function text(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' })
  return { status: res.status, body: await res.text(), headers: res.headers }
}

// 1) Offentlige sider svarer
const publicPages = [
  '/', '/find-lift', '/tilmeld', '/log-ind', '/glemt-kodeord', '/samkoersel', '/om-koermed', '/sikkerhed',
  '/vilkaar', '/privatliv', '/cookies', '/kontakt', '/stoet-koermed', '/anmeld-ulovligt-indhold', '/robots.txt', '/sitemap.xml',
]
for (const p of publicPages) {
  try {
    const { status } = await text(p)
    status === 200 ? ok.push(p) : fail(`Siden ${p} svarer ${status} (forventet 200)`)
  } catch (e) {
    fail(`Siden ${p} kunne ikke hentes: ${e.message}`)
  }
}

// 2) Lukkede sider sender videre til login (ikke 200)
for (const p of ['/admin', '/profil', '/mine-ture', '/mine-bookinger', '/beskeder', '/tilbyd-lift']) {
  const res = await get(p)
  if (![301, 302, 303, 307, 308].includes(res.status)) fail(`Lukket side ${p} svarer ${res.status} i stedet for at sende videre til login`)
}

// 3) Ukendt side giver 404
if ((await get('/findes-ikke-' + Date.now())).status !== 404) fail('Ukendte adresser giver ikke 404')

// 4) Sikkerhedsheadere
{
  const res = await get('/')
  const required = {
    'strict-transport-security': null,
    'x-content-type-options': 'nosniff',
    'x-frame-options': null,
    'referrer-policy': null,
  }
  for (const [h, want] of Object.entries(required)) {
    const v = res.headers.get(h)
    if (!v) fail(`Sikkerhedsheader mangler: ${h}`)
    else if (want && v.toLowerCase() !== want) fail(`Sikkerhedsheader ${h} har uventet værdi: ${v}`)
  }
}

// 5) Ingen pladsholdere eller eksempeldata i juridiske sider og kontakt
for (const p of ['/vilkaar', '/privatliv', '/kontakt', '/cookies', '/sikkerhed']) {
  const { body } = await text(p)
  const hits = ['[COMPANY NAME]', '[CVR]', '[ADDRESS]', '[EMAIL]', 'example.dk', 'kontakt@example'].filter((s) => body.includes(s))
  if (hits.length) fail(`Pladsholder fundet på ${p}: ${hits.join(', ')}`)
}

// 5b) Vilkår og privatlivspolitik indeholder de centrale afsnit (ikke kun en tom pladsholder)
{
  const terms = (await text('/vilkaar')).body
  if (!/udelukk/i.test(terms)) fail('/vilkaar nævner ikke udelukkelse')
  const privacy = (await text('/privatliv')).body
  if (!privacy.includes('Datatilsynet')) fail('/privatliv nævner ikke retten til at klage til Datatilsynet')
}

// 6) Kontaktside viser firmaoplysninger
{
  const { body } = await text('/kontakt')
  for (const needle of ['Dosage', '30144783', '@']) {
    if (!body.includes(needle)) fail(`/kontakt mangler "${needle}"`)
  }
}

// 7) Påkrævede juridiske sider linkes fra forsiden/footer
{
  const { body } = await text('/')
  for (const href of ['/vilkaar', '/privatliv', '/cookies', '/kontakt', '/anmeld-ulovligt-indhold']) {
    if (!body.includes(`href="${href}"`)) fail(`Forsiden linker ikke til ${href}`)
  }
}

// 8) robots.txt skjuler private områder
{
  const { body } = await text('/robots.txt')
  for (const path of ['/admin', '/profil']) {
    if (!body.includes(path)) fail(`robots.txt skjuler ikke ${path}`)
  }
}

// 9) www har gyldigt certifikat og sender videre til hoveddomænet
try {
  const res = await fetch(WWW + '/', { redirect: 'manual' })
  const loc = res.headers.get('location') || ''
  if (![301, 308, 307, 302].includes(res.status) || !loc.startsWith(BASE)) {
    fail(`www sender ikke videre til ${BASE} (status ${res.status}, location "${loc}")`)
  }
} catch (e) {
  fail(`www kunne ikke åbnes (certifikat/DNS?): ${e.message}`)
}

// 10) Certifikatets udløb (advarsel 14 dage før)
try {
  const { connect } = await import('node:tls')
  const host = new URL(BASE).hostname
  const days = await new Promise((resolve, reject) => {
    const s = connect({ host, port: 443, servername: host }, () => {
      const c = s.getPeerCertificate()
      s.end()
      resolve(Math.floor((new Date(c.valid_to) - Date.now()) / 86400000))
    })
    s.on('error', reject)
  })
  if (days < 14) fail(`Certifikatet udløber om ${days} dage`)
} catch (e) {
  fail(`Kunne ikke tjekke certifikat: ${e.message}`)
}

console.log(`Kontrol af ${BASE}: ${ok.length} sider ok, ${problems.length} problemer`)
if (problems.length) {
  for (const p of problems) console.error('  ✗ ' + p)
  process.exit(1)
}
console.log('Alt ser fint ud.')
