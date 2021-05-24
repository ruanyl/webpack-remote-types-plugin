import { Compiler } from 'webpack'
import { URL } from 'url'
import fs from 'fs-extra'
import http from 'http'
import path from 'path'
import tar from 'tar'

const cwd = process.cwd()

function downloadFile(url: string, targetPath: string) {
  return new Promise<boolean>((resolve) => {
    const target = fs.createWriteStream(targetPath)
    http.get(url, (response) => {
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
    const dtsFileName = remoteFileName.replace('[name]', moduleName)
    const dtsFileURL = new URL(dtsFileName, entryFileURL).href
    const targetFile = path.resolve(outputDir, dtsFileName)

    await fs.ensureDir(outputDir)

    console.log('Downloading: ', dtsFileURL)
    const saved = await downloadFile(dtsFileURL, targetFile)
    if (saved) {
      savedDts.push(targetFile)
      console.log('Saved: ', targetFile)
      tar.x({
        file: targetFile,
        cwd: outputDir,
      })
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

  constructor(options: Options) {
    this.options = options
  }

  apply(compiler: Compiler) {
    compiler.hooks.beforeRun.tapPromise('WebpackRemoteTypesPlugin', () => {
      return downloadFederationTypes(
        this.options.remotes,
        path.resolve(cwd, this.options.outputDir),
        this.options.remoteFileName
      )
    })
  }
}
