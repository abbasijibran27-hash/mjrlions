/* =========================================================================
   MJR LION AGENCY — public site content
   (Private team profiles & client projects are NOT here — they ship encrypted.)
   ========================================================================= */
window.SITE_CONFIG = {
  /* Set to false before going live to hide the demo tracking IDs hint. */
  DEMO_MODE: false,
  /* Replaceable photography. Put an image URL (or data: URI) against any key
     and it replaces the art-directed placeholder automatically. */
  IMAGES: {
    'svc-web-development': 'images/services/web-development-8ceb51f6', 'svc-social-media-management': '', 'svc-performance-marketing': '',
    'svc-graphic-design': '', 'svc-video-editing': '', 'svc-ai-videos': '', 'svc-ugc-production': '',
    'svc-content-writing': '', 'svc-lead-generation': '', 'svc-ai-content-creation': ''
  },
  /* focus point of each photo inside its frame (CSS object-position) */
  IMAGE_POS: { 'svc-web-development': '70% 50%' },
  TEAM_PHOTOS: { mjr: '', sana: '', roma: '', wasi: '', wahab: '', husnain: '', jamshaid: '' },
  /* MJR showreel — add video URLs (mp4/webm) to play real edits in the profile */
  SHOWREEL: ['', '', '', '', '', ''],
  /* Home page lion photo (Unsplash License — photo by Rod Long, unsplash.com/@rodlong).
     Replace with your own lion image URL any time; if it fails to load, the 3D gold lion shows instead. */
  HERO_LION: 'https://images.unsplash.com/photo-1697638332466-16f48f835b96'
};

const faq = (name, howLong, included, tools) => [
  { q: `How long does a typical ${name} engagement take?`, a: howLong },
  { q: 'What is included in the price?', a: included },
  { q: 'Can you work with our existing team or tools?', a: `Yes. We plug into your existing workflow and team — and we're fluent in ${tools}.` },
  { q: 'Do you sign NDAs?', a: "Yes. We're happy to sign an NDA before you share any confidential information about your brand or project." }
];

window.SERVICES = [
  {
    id: 'web-development', no: '01', name: 'Web Development', icon: 'web',
    desc: 'High-performance, cinematic websites engineered pixel-perfect. Framer-grade motion, edge-fast, conversion-tuned.',
    features: ['Cinematic hero moments & scroll storytelling', 'Edge-fast Core Web Vitals', 'Headless CMS integration', 'SEO foundation & schema markup', 'Fully responsive across every device'],
    benefits: ['Higher conversion from a premium first impression', 'Better search rankings & organic reach', 'Owned platform you can scale for years'],
    process: ['Discovery & scope alignment', 'UX architecture & wireframes', 'Design system & prototypes', 'Development & QA', 'Launch, analytics & handover'],
    timeline: '2–6 weeks',
    tech: ['Next.js', 'TanStack', 'React', 'Tailwind', 'GSAP', 'Framer', 'Motion', 'Sanity', 'Contentful'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Pixel-perfect',
    art: 'Premium developer workstation / website interface',
    price: 'Web Development is $499–$699 per project',
    faqs: null
  },
  {
    id: 'social-media-management', no: '02', name: 'Social Media Management', icon: 'social',
    desc: 'Content systems that turn audiences into communities. Story-first strategy, always-on production, measurable reach.',
    features: ['Editorial content strategy', '20–30 premium assets per month', 'Community management & engagement', 'Analytics & monthly performance reviews'],
    benefits: ['Consistent presence that compounds reach', 'Content that actually reflects your brand', 'Turn followers into a real community'],
    process: ['Audit & positioning', 'Content pillars', 'Production sprints', 'Publish & engage', 'Report & iterate'],
    timeline: 'Depends on work type — contract-based or project-wise',
    tech: ['Meta Business Suite', 'TikTok Studio', 'Later', 'Notion', 'Adobe Suite'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Always-on content',
    art: 'Professional social media strategist working with analytics',
    price: 'Social Media Management is $499–$599 per month'
  },
  {
    id: 'performance-marketing', no: '03', name: 'Performance Marketing', icon: 'perf',
    desc: 'Meta, Google, TikTok, LinkedIn — orchestrated. We engineer funnels that scale efficiently, not just spend.',
    features: ['TikTok Ads', 'Facebook Ads', 'Instagram Ads', 'Google Ads', 'Full-funnel campaign architecture', 'Creative testing frameworks', 'Advanced tracking & attribution', 'Weekly optimization & reporting'],
    benefits: ['Lower CAC, higher LTV', 'Predictable pipeline', 'Clarity on what works and why'],
    process: ['Audit & benchmarking', 'Funnel & creative build', 'Launch & scale', 'Optimize continuously'],
    timeline: 'According to client requirements',
    tech: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'GA4', 'GTM'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Full-funnel',
    art: 'Advertising dashboards / campaign strategy',
    price: 'Paid Ads (TikTok, Facebook, Instagram, Google) is $300–$349 per month — the mentioned price is service charges only (per month)'
  },
  {
    id: 'graphic-design', no: '04', name: 'Graphic Design', icon: 'design',
    desc: 'Editorial-grade brand systems. Logos, identity, decks, packaging — designed to look premium in every context.',
    features: ['Brand strategy & positioning', 'Logo & identity system', 'Typography & motion', 'Guidelines & templates'],
    benefits: ['A brand that looks premium in every context', 'Faster in-house execution', 'Long-term consistency'],
    process: ['Discovery', 'Strategy', 'Design', 'Refinement', 'Handover'],
    timeline: 'Depending on your choice — contract or project-wise',
    tech: ['Figma', 'Illustrator', 'Photoshop', 'After Effects'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Brand system',
    art: 'Designer working on brand identity',
    price: 'Graphic Design is $120–$250 per project'
  },
  {
    id: 'video-editing', no: '05', name: 'Video Editing', icon: 'video',
    desc: "Cinematic ads, reels, and long-form. Color, sound, motion — crafted like a film, delivered on a startup's clock.",
    features: ['Cinematic color grading', 'Sound design & scoring', 'Motion graphics', 'Cross-platform edits'],
    benefits: ['Film-grade output at startup speed', 'Consistent brand aesthetic', 'Delivery on every platform ratio'],
    process: ['Brief', 'Assembly', 'Rough cut', 'Fine cut', 'Color & sound', 'Delivery'],
    timeline: 'Depending on your choice — contract-based or project-wise',
    tech: ['Premiere Pro', 'DaVinci Resolve', 'After Effects', 'Cinema 4D'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Color · Sound · Motion',
    art: 'Professional editor workstation',
    price: 'Video Editing is $120–$200 per project'
  },
  {
    id: 'ai-videos', no: '06', name: 'AI Videos', icon: 'aivideo',
    desc: 'Studio-quality AI video pipelines: avatars, product demos, personalized creative at previously impossible scale.',
    features: ['AI-generated hero films', 'Product demos & explainers', 'Personalized creative at scale', 'Custom AI avatars'],
    benefits: ['Studio quality without studio cost', 'Iterate creative in hours, not weeks', 'Scale personalization'],
    process: ['Concept', 'Script', 'AI generation', 'Editing & polish', 'Delivery'],
    timeline: 'Depending on your choice — contract-based or project-wise',
    tech: ['Sora', 'Runway', 'Kling', 'Veo', 'ElevenLabs', 'HeyGen'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'AI pipelines',
    art: 'Professional AI production environment',
    price: 'AI Video Editing is $150–$180 per video'
  },
  {
    id: 'ugc-production', no: '07', name: 'UGC Production', icon: 'ugc',
    desc: 'Native, creator-led content that outperforms polished ads. Vetted creators, briefs that convert, at speed.',
    features: ['Vetted creator network', 'Conversion-focused briefs', 'Fast turnaround production', 'Cross-platform variants'],
    benefits: ['Higher CTRs than polished ads', 'Native trust with audiences', 'Endless creative variety'],
    process: ['Creator matching', 'Brief & script', 'Production', 'Editing', 'Delivery'],
    timeline: 'Depending on your choice — contract-based or project-wise',
    tech: ['Backlight', 'Frame.io', 'Notion'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Creator-led',
    art: 'Realistic creator filming product content',
    price: 'UGC Ads Creation is $200–$250 per creator batch'
  },
  {
    id: 'content-writing', no: '08', name: 'Content Writing', icon: 'write',
    desc: 'Copy that sells without shouting. SEO-native long-form, brand voice frameworks, and launch-ready campaigns.',
    features: ['Brand voice framework', 'SEO-native long form', 'Launch & campaign copy', 'Ongoing editorial support'],
    benefits: ['Copy that converts without shouting', 'Consistent tone across every touchpoint', 'Search-first structure'],
    process: ['Voice discovery', 'Content strategy', 'Draft & refine', 'Publish & optimize'],
    timeline: 'Per-piece or monthly retainer',
    tech: ['Notion', 'Ahrefs', 'Surfer', 'Grammarly Business'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'SEO-native',
    art: 'Professional editorial workspace',
    price: 'Content Creation / Writing is $499–$599 per month'
  },
  {
    id: 'lead-generation', no: '09', name: 'Lead Generation', icon: 'lead',
    desc: 'Outbound + inbound engines with CRM automation. Qualified pipeline, not vanity metrics.',
    features: ['Outbound sequences', 'Inbound landing pages', 'CRM automation', 'Lead scoring'],
    benefits: ['Predictable qualified pipeline', 'Sales team focused on closers, not chasers'],
    process: ['ICP definition', 'List & tooling', 'Sequences', 'Optimize'],
    timeline: '2 week setup · ongoing management',
    tech: ['HubSpot', 'Apollo', 'Instantly', 'Clay', 'Zapier'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'CRM automation',
    art: 'Sales / CRM analytics environment',
    price: 'Lead Generation is $100–$180 per month'
  },
  {
    id: 'ai-content-creation', no: '10', name: 'AI Content Creation', icon: 'aicontent',
    desc: 'AI-assisted content engines for posts, scripts, hooks and campaign copy — brand-trained, human-refined, published at scale.',
    features: ['Brand-trained AI content engine', 'Post, script & hook generation', 'SEO-native blog and landing copy', 'Human editorial refinement pass', 'Content calendars at scale'],
    benefits: ['Weeks of content produced in days', 'Consistent brand voice across channels', 'Lower production cost per asset'],
    process: ['Voice training', 'Prompt & brief system', 'AI generation', 'Human refinement', 'Publish & measure'],
    timeline: '3–7 days per content sprint',
    tech: ['GPT-5', 'Claude', 'Gemini', 'Midjourney', 'ElevenLabs', 'Notion'],
    wins: [], // add real client results here later, e.g. [['+120%', 'Traffic in 90 days for Client X']]
    chip: 'Brand-trained AI',
    art: 'Professional AI creative workflow',
    price: null
  }
];

const HOW_LONG = {
  'web-development': 'Most website projects take 2–6 weeks, depending on scope. We confirm the exact timeline during discovery & scope alignment.',
  'social-media-management': 'It depends on the work type — we run social media management either contract-based or project-wise, and agree the timeline before we start.',
  'performance-marketing': "It's set according to your requirements — campaigns can run as a short launch push or as an ongoing, continuously optimized engagement.",
  'graphic-design': 'Depending on your choice — contract or project-wise. We agree the timeline with you before we start.',
  'video-editing': 'Depending on your choice — contract-based or project-wise. We agree delivery dates for every cut at the brief stage.',
  'ai-videos': 'Depending on your choice — contract-based or project-wise. Because AI generation is fast, creative iterations happen in hours, not weeks.',
  'ugc-production': 'Depending on your choice — contract-based or project-wise, with fast-turnaround production once creators are matched.',
  'content-writing': 'We work per-piece or on a monthly retainer — whichever fits your publishing rhythm.',
  'lead-generation': 'Setup takes about 2 weeks, followed by ongoing management and optimization.',
  'ai-content-creation': 'Each content sprint takes 3–7 days, from voice training to published, measured content.'
};
const FAQ_NAME = {
  'web-development': 'website development', 'social-media-management': 'social media', 'performance-marketing': 'performance marketing',
  'graphic-design': 'graphic design', 'video-editing': 'video editing', 'ai-videos': 'AI videos', 'ugc-production': 'UGC production',
  'content-writing': 'content writing', 'lead-generation': 'lead generation', 'ai-content-creation': 'AI content creation'
};
window.SERVICES.forEach(s => {
  const inc = `Everything listed under Features — ${s.features.join(', ').replace(/, ([^,]*)$/, ' and $1')}. ` + (s.price ? `${s.price}.` : 'Pricing is scoped per content sprint — tell us your volume and channels and we will quote.');
  s.faqs = faq(FAQ_NAME[s.id], HOW_LONG[s.id], inc, s.tech.slice(0, 4).join(', '));
});

window.PRICING = [
  { name: 'Video Editing', d: 'Per project · cinematic color, sound and motion', p: '$120–$200', svc: 'video-editing' },
  { name: 'AI Video Editing', d: 'Per video · avatars, product demos, AI b-roll', p: '$150–$180', svc: 'ai-videos' },
  { name: 'UGC Ads Creation', d: 'Per creator batch · scripted, native, platform-ready', p: '$200–$250', svc: 'ugc-production' },
  { name: 'Graphic Design', d: 'Per project · identity, decks, ad creative', p: '$120–$250', svc: 'graphic-design' },
  { name: 'Social Media Management', d: 'Per month · strategy, content, community, reporting', p: '$499–$599', svc: 'social-media-management' },
  { name: 'Lead Generation', d: 'Per month · outbound engines, CRM automation', p: '$100–$180', svc: 'lead-generation' },
  { name: 'Paid Ads', d: 'TikTok Ads · Facebook Ads · Instagram Ads · Google Ads', p: '$300–$349', unit: '/ month', note: 'Mentioned price is just service charges (per month).', svc: 'performance-marketing' },
  { name: 'Web Development', d: 'Per project · bespoke, fast, conversion-built sites', p: '$499–$699', svc: 'web-development' },
  { name: 'Content Creation / Writing', d: 'Per month · SEO-native copy, scripts, newsletters', p: '$499–$599', svc: 'content-writing' }
];

window.CONTACT = {
  emails: ['mjrlionagency.com', 'mjrlioncomolain.com'],
  helpline: ['+92 302 8939864', '+92 315 0057588'],
  complaints: ['+92 316 5495681'],
  whatsapp: '923028939864'
};
