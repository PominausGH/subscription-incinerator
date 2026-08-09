import fs from 'fs'
import path from 'path'
import { cancellationServices } from '../lib/cancel/services'

/**
 * Script to export cancellation guide data to CSV for social media asset generation.
 * This CSV is optimized for Canva Bulk Create.
 */
function exportToCsv() {
  const outputDir = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const filePath = path.join(outputDir, 'social-assets-data.csv')
  
  // Define CSV headers
  const headers = [
    'Name',
    'Logo',
    'MonthlyPrice',
    'AnnualCost',
    'Difficulty',
    'WhyPeopleForgot',
    'Step1', 'Step2', 'Step3', 'Step4', 'Step5', 'Step6', 'Step7',
    'Warning1', 'Warning2', 'Warning3',
    'DirectUrl'
  ]

  const rows = cancellationServices.map(service => {
    // Pad steps and warnings to ensure consistent column count
    const steps = [...service.steps, '', '', '', '', '', '', ''].slice(0, 7)
    const warnings = [...service.warnings, '', '', ''].slice(0, 3)

    return [
      service.name,
      service.logo,
      service.monthlyPrice,
      service.annualCost,
      service.difficulty,
      `"${service.whyPeopleForgot.replace(/"/g, '""')}"`, // Escape quotes for CSV
      ...steps.map(s => `"${s.replace(/"/g, '""')}"`),
      ...warnings.map(w => `"${w.replace(/"/g, '""')}"`),
      service.directCancelUrl || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  fs.writeFileSync(filePath, csvContent)
  console.log(`✅ Social assets data exported to: ${filePath}`)
  console.log(`📊 Total services exported: ${cancellationServices.length}`)
  console.log(`💡 Next step: Upload this file to Canva Bulk Create to generate your social posts!`)
}

exportToCsv()
