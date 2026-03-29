import { prisma } from '../lib/prisma.js'
import type { CVOutput } from './upload-to-modal.js'

/**
 * Gera o relatório estruturado a partir do output do pipeline CV.
 * Cria o registro Report com shareToken único.
 */
export async function generateReport(matchId: string, cvOutput: CVOutput): Promise<void> {
  console.log(`[report] Gerando relatório para partida ${matchId}`)

  // Upsert Report com shareToken determinístico (evita duplicatas em retries)
  await prisma.report.upsert({
    where: { shareToken: `share-${matchId}` },
    update: { pdfUrl: null },
    create: {
      matchId,
      shareToken: `share-${matchId}`,
      tipo: 'completo',
    },
  })

  const totalEventos = cvOutput.events?.length || 0
  const confiancas = (cvOutput.events || []).map(e => e.confidence).filter(Boolean)
  const confiancaMedia = confiancas.length
    ? confiancas.reduce((a, b) => a + b, 0) / confiancas.length
    : cvOutput.confianca_media || 0

  console.log(
    `[report] ✅ Relatório criado para partida ${matchId} — ` +
    `${totalEventos} eventos, confiança ${(confiancaMedia * 100).toFixed(1)}%`
  )

  // TODO: Gerar PDF com puppeteer ou react-pdf
  // const pdfBuffer = await generatePDF({ matchId, cvOutput, ... })
  // const pdfChave = `reports/${matchId}/relatorio-completo.pdf`
  // await uploadToR2(pdfChave, pdfBuffer)
  // await prisma.report.update({ where: { shareToken: `share-${matchId}` }, data: { pdfUrl: pdfChave } })
}
