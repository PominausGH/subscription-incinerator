// Load environment variables and modify for seeding BEFORE any Prisma imports
import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// For seeding, extract TCP URL from Prisma Accelerate URL
// This avoids compatibility issues with Prisma Client 7.2.0 and `prisma dev` HTTP connections
let connectionString = process.env.DATABASE_URL

if (connectionString?.startsWith('prisma+postgres://')) {
  const match = connectionString.match(/api_key=([^&]+)/)
  if (match) {
    try {
      const apiKey = match[1]
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
      connectionString = decoded.databaseUrl
      console.log('Using TCP connection for seeding')
    } catch (e) {
      console.error('Failed to extract TCP URL from api_key:', e)
    }
  }
}

// Create connection pool and adapter for direct TCP connection
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Create a fresh client with the adapter
const db = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

const ALTERNATIVES = [
  // Streaming Video → Jellyfin
  ...[
    'Netflix', 'Disney+', 'HBO Max', 'Max', 'Hulu',
    'Paramount+', 'Peacock', 'Crunchyroll', 'Amazon Prime Video',
  ].map(service => ({
    serviceName: service,
    alternativeName: 'Jellyfin',
    description: 'Free software media system that lets you manage and stream your media collection',
    websiteUrl: 'https://jellyfin.org',
    sourceCodeUrl: 'https://github.com/jellyfin/jellyfin',
    stars: 36000,
    license: 'GPL-2.0',
    category: 'Media Streaming',
  })),

  // YouTube Premium → Invidious, PeerTube
  {
    serviceName: 'YouTube Premium',
    alternativeName: 'Invidious',
    description: 'Alternative front-end to YouTube with no ads and no tracking',
    websiteUrl: 'https://invidious.io',
    sourceCodeUrl: 'https://github.com/iv-org/invidious',
    stars: 16000,
    license: 'AGPL-3.0',
    category: 'Media Streaming',
  },
  {
    serviceName: 'YouTube Premium',
    alternativeName: 'PeerTube',
    description: 'Decentralized video hosting network based on free/libre software',
    websiteUrl: 'https://joinpeertube.org',
    sourceCodeUrl: 'https://github.com/Chocobozzz/PeerTube',
    stars: 13000,
    license: 'AGPL-3.0',
    category: 'Media Streaming',
  },

  // Spotify → Navidrome, Funkwhale
  {
    serviceName: 'Spotify',
    alternativeName: 'Navidrome',
    description: 'Modern music server and streamer compatible with Subsonic/Airsonic',
    websiteUrl: 'https://www.navidrome.org',
    sourceCodeUrl: 'https://github.com/navidrome/navidrome',
    stars: 12000,
    license: 'GPL-3.0',
    category: 'Music Streaming',
  },
  {
    serviceName: 'Spotify',
    alternativeName: 'Funkwhale',
    description: 'Social platform to enjoy and share music with a decentralized architecture',
    websiteUrl: 'https://funkwhale.audio',
    sourceCodeUrl: 'https://dev.funkwhale.audio/funkwhale/funkwhale',
    stars: 1600,
    license: 'AGPL-3.0',
    category: 'Music Streaming',
  },

  // Cloud Storage → Nextcloud, Syncthing
  ...[
    'Dropbox', 'Google One',
  ].flatMap(service => [
    {
      serviceName: service,
      alternativeName: 'Nextcloud',
      description: 'Suite of client-server software for creating and using file hosting services',
      websiteUrl: 'https://nextcloud.com',
      sourceCodeUrl: 'https://github.com/nextcloud/server',
      stars: 28000,
      license: 'AGPL-3.0',
      category: 'Cloud Storage',
    },
    {
      serviceName: service,
      alternativeName: 'Syncthing',
      description: 'Continuous file synchronization program that synchronizes files between devices',
      websiteUrl: 'https://syncthing.net',
      sourceCodeUrl: 'https://github.com/syncthing/syncthing',
      stars: 66000,
      license: 'MPL-2.0',
      category: 'Cloud Storage',
    },
  ]),

  // Adobe Creative Cloud → GIMP, Inkscape, Kdenlive
  {
    serviceName: 'Adobe Creative Cloud',
    alternativeName: 'GIMP',
    description: 'Free and open-source raster graphics editor for image manipulation and editing',
    websiteUrl: 'https://www.gimp.org',
    sourceCodeUrl: 'https://gitlab.gnome.org/GNOME/gimp',
    stars: 1800,
    license: 'GPL-3.0',
    category: 'Design & Creative',
  },
  {
    serviceName: 'Adobe Creative Cloud',
    alternativeName: 'Inkscape',
    description: 'Professional vector graphics editor for creating scalable illustrations and designs',
    websiteUrl: 'https://inkscape.org',
    sourceCodeUrl: 'https://gitlab.com/inkscape/inkscape',
    stars: 2200,
    license: 'GPL-2.0',
    category: 'Design & Creative',
  },
  {
    serviceName: 'Adobe Creative Cloud',
    alternativeName: 'Kdenlive',
    description: 'Non-linear video editor with multi-track editing and a wide range of effects',
    websiteUrl: 'https://kdenlive.org',
    sourceCodeUrl: 'https://invent.kde.org/multimedia/kdenlive',
    stars: 3100,
    license: 'GPL-3.0',
    category: 'Design & Creative',
  },

  // Canva, Figma → Penpot
  ...[
    'Canva', 'Figma',
  ].map(service => ({
    serviceName: service,
    alternativeName: 'Penpot',
    description: 'Open-source design and prototyping platform for cross-domain teams',
    websiteUrl: 'https://penpot.app',
    sourceCodeUrl: 'https://github.com/penpot/penpot',
    stars: 34000,
    license: 'MPL-2.0',
    category: 'Design & Creative',
  })),

  // Notion → AppFlowy, Outline
  {
    serviceName: 'Notion',
    alternativeName: 'AppFlowy',
    description: 'Open-source alternative to Notion for managing wikis, projects, and documents',
    websiteUrl: 'https://appflowy.io',
    sourceCodeUrl: 'https://github.com/AppFlowy-IO/AppFlowy',
    stars: 58000,
    license: 'AGPL-3.0',
    category: 'Productivity',
  },
  {
    serviceName: 'Notion',
    alternativeName: 'Outline',
    description: 'Fast, collaborative team knowledge base and wiki',
    websiteUrl: 'https://www.getoutline.com',
    sourceCodeUrl: 'https://github.com/outline/outline',
    stars: 29000,
    license: 'BSL-1.1',
    category: 'Productivity',
  },

  // Evernote → Joplin
  {
    serviceName: 'Evernote',
    alternativeName: 'Joplin',
    description: 'Note-taking and to-do application with synchronization and encryption capabilities',
    websiteUrl: 'https://joplinapp.org',
    sourceCodeUrl: 'https://github.com/laurent22/joplin',
    stars: 47000,
    license: 'AGPL-3.0',
    category: 'Productivity',
  },

  // Todoist → Vikunja
  {
    serviceName: 'Todoist',
    alternativeName: 'Vikunja',
    description: 'Open-source to-do app with task management, kanban boards, and CalDAV support',
    websiteUrl: 'https://vikunja.io',
    sourceCodeUrl: 'https://kolaente.dev/vikunja/vikunja',
    stars: 1000,
    license: 'AGPL-3.0',
    category: 'Productivity',
  },

  // Slack → Mattermost, Rocket.Chat
  {
    serviceName: 'Slack',
    alternativeName: 'Mattermost',
    description: 'Open-source platform for secure collaboration across the development lifecycle',
    websiteUrl: 'https://mattermost.com',
    sourceCodeUrl: 'https://github.com/mattermost/mattermost',
    stars: 31000,
    license: 'AGPL-3.0',
    category: 'Communication',
  },
  {
    serviceName: 'Slack',
    alternativeName: 'Rocket.Chat',
    description: 'Fully customizable communications platform for organizations with high data-protection standards',
    websiteUrl: 'https://rocket.chat',
    sourceCodeUrl: 'https://github.com/RocketChat/Rocket.Chat',
    stars: 41000,
    license: 'MIT',
    category: 'Communication',
  },

  // Zoom → Jitsi Meet
  {
    serviceName: 'Zoom',
    alternativeName: 'Jitsi Meet',
    description: 'Secure, fully featured, and completely free video conferencing solution',
    websiteUrl: 'https://jitsi.org',
    sourceCodeUrl: 'https://github.com/jitsi/jitsi-meet',
    stars: 23000,
    license: 'Apache-2.0',
    category: 'Communication',
  },

  // VPNs → WireGuard
  ...[
    'NordVPN', 'ExpressVPN', 'Surfshark',
  ].map(service => ({
    serviceName: service,
    alternativeName: 'WireGuard',
    description: 'Extremely simple yet fast and modern VPN that utilizes state-of-the-art cryptography',
    websiteUrl: 'https://www.wireguard.com',
    sourceCodeUrl: 'https://www.wireguard.com/repositories/',
    stars: 0,
    license: 'GPL-2.0',
    category: 'VPN & Security',
  })),

  // Password Managers → Vaultwarden, KeePassXC
  ...[
    '1Password', 'LastPass',
  ].flatMap(service => [
    {
      serviceName: service,
      alternativeName: 'Vaultwarden',
      description: 'Lightweight Bitwarden-compatible server written in Rust for self-hosting',
      websiteUrl: 'https://github.com/dani-garcia/vaultwarden',
      sourceCodeUrl: 'https://github.com/dani-garcia/vaultwarden',
      stars: 40000,
      license: 'AGPL-3.0',
      category: 'VPN & Security',
    },
    {
      serviceName: service,
      alternativeName: 'KeePassXC',
      description: 'Cross-platform community-driven password manager with browser integration',
      websiteUrl: 'https://keepassxc.org',
      sourceCodeUrl: 'https://github.com/keepassxreboot/keepassxc',
      stars: 22000,
      license: 'GPL-3.0',
      category: 'VPN & Security',
    },
  ]),

  // ChatGPT Plus → Ollama, Open WebUI
  {
    serviceName: 'ChatGPT Plus',
    alternativeName: 'Ollama',
    description: 'Run large language models locally with a simple CLI interface',
    websiteUrl: 'https://ollama.com',
    sourceCodeUrl: 'https://github.com/ollama/ollama',
    stars: 105000,
    license: 'MIT',
    category: 'AI & Machine Learning',
  },
  {
    serviceName: 'ChatGPT Plus',
    alternativeName: 'Open WebUI',
    description: 'User-friendly web interface for running LLMs locally with chat functionality',
    websiteUrl: 'https://openwebui.com',
    sourceCodeUrl: 'https://github.com/open-webui/open-webui',
    stars: 55000,
    license: 'MIT',
    category: 'AI & Machine Learning',
  },

  // Mailchimp → Listmonk
  {
    serviceName: 'Mailchimp',
    alternativeName: 'Listmonk',
    description: 'High performance self-hosted newsletter and mailing list manager',
    websiteUrl: 'https://listmonk.app',
    sourceCodeUrl: 'https://github.com/knadh/listmonk',
    stars: 15000,
    license: 'AGPL-3.0',
    category: 'Marketing',
  },

  // Duolingo → LibreLingo
  {
    serviceName: 'Duolingo',
    alternativeName: 'LibreLingo',
    description: 'Community-driven open-source language learning platform',
    websiteUrl: 'https://librelingo.app',
    sourceCodeUrl: 'https://github.com/LibreLingo/LibreLingo',
    stars: 1900,
    license: 'AGPL-3.0',
    category: 'Education',
  },

  // Grammarly → LanguageTool
  {
    serviceName: 'Grammarly',
    alternativeName: 'LanguageTool',
    description: 'Multilingual grammar, style, and spell checker with support for 30+ languages',
    websiteUrl: 'https://languagetool.org',
    sourceCodeUrl: 'https://github.com/languagetool-org/languagetool',
    stars: 12000,
    license: 'LGPL-2.1',
    category: 'Productivity',
  },

  // GitHub → Gitea, GitLab CE
  {
    serviceName: 'GitHub',
    alternativeName: 'Gitea',
    description: 'Painless self-hosted all-in-one software development service including Git hosting',
    websiteUrl: 'https://gitea.com',
    sourceCodeUrl: 'https://github.com/go-gitea/gitea',
    stars: 46000,
    license: 'MIT',
    category: 'Development',
  },
  {
    serviceName: 'GitHub',
    alternativeName: 'GitLab CE',
    description: 'Complete DevOps platform with Git repository management, CI/CD, and more',
    websiteUrl: 'https://about.gitlab.com',
    sourceCodeUrl: 'https://gitlab.com/gitlab-org/gitlab-foss',
    stars: 24000,
    license: 'MIT',
    category: 'Development',
  },
]

async function main() {
  console.log('Seeding open-source alternatives...')

  for (const alt of ALTERNATIVES) {
    await db.openSourceAlternative.upsert({
      where: {
        serviceName_alternativeName: {
          serviceName: alt.serviceName,
          alternativeName: alt.alternativeName,
        },
      },
      update: {
        description: alt.description,
        websiteUrl: alt.websiteUrl,
        sourceCodeUrl: alt.sourceCodeUrl,
        stars: alt.stars,
        license: alt.license,
        category: alt.category,
      },
      create: alt,
    })
  }

  console.log(`Seeded ${ALTERNATIVES.length} open-source alternatives`)
}

main()
  .then(async () => {
    await db.$disconnect()
    await pool.end()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    await pool.end()
    process.exit(1)
  })
