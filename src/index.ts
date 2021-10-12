import { Compiler } from 'webpack'
import { URL } from 'url'
import fs from 'fs-extra'
import https from 'https'
import http from 'http'
import path from 'path'
import tar from 'tar'

const cwd = process.cwd()

export function downloadFile(url: string, targetPath: string) {
  const get = url.includes('https://') ? https.get : http.get

  return new Promise<boolean>((resolve) => {
    const target = fs.createWriteStream(targetPath)
    get(url, (response) => {
      response
        .pipe(target)
        .on('close', () => {
          resolve(true)
        })
        .on('finish', () => {
          resolve(true)
        })
        .on('error', () => {
          resolve(false)
        })
    })
  })
}

async function downloadFederationTypes(
  remotes: Record<string, string>,
  outputDir: string,
  remoteFileName: string = '[name]-dts.tgz'
) {
  // Paths of downloaded dts zip files
  const savedDts: string[] = []

  for (const [, value] of Object.entries(remotes)) {
    const [moduleName, entryFileURL] = value.split('@')
    const outputPath = outputDir.replace('[name]', moduleName)
    const dtsFileName = remoteFileName.replace('[name]', moduleName)
    const dtsFileURL = new URL(dtsFileName, entryFileURL).href
    const targetFile = path.resolve(outputPath, dtsFileName)

    await fs.ensureDir(outputPath)

    console.log('Downloading: ', dtsFileURL)
    const saved = await downloadFile(dtsFileURL, targetFile)
    if (saved) {
      savedDts.push(targetFile)
      console.log('Saved: ', targetFile)
      await tar.x({
        file: targetFile,
        cwd: outputPath,
      })
      await fs.remove(targetFile)
    } else {
      console.error('Failed to download remote DTS: ', dtsFileURL)
    }
  }
}

interface Options {
  remotes: Record<string, string>
  outputDir: string
  remoteFileName?: string
}

export default class WebpackRemoteTypesPlugin {
  options: Options
  private remotes: Record<string, string> = {}
  private outputDir: string = ''
  private remoteFileName: string | undefined

  constructor(options: Options) {
    this.options = options
  }

  apply(compiler: Compiler) {
    const tapCallback = async () => {
      const { remotes, remoteFileName, outputDir } = this.options
      const output = path.resolve(cwd, outputDir)
      const paramsChanged = this.remotes !== remotes || this.outputDir !== output || this.remoteFileName !== remoteFileName
      if (paramsChanged) {
        await downloadFederationTypes(remotes, output, remoteFileName)
        this.remotes = remotes
        this.outputDir = output
        this.remoteFileName = remoteFileName
      }
    }

    compiler.hooks.beforeRun.tapPromise('WebpackRemoteTypesPlugin', tapCallback)
    compiler.hooks.watchRun.tapPromise('WebpackRemoteTypesPlugin', tapCallback)
  }
}
