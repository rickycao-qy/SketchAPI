/* globals expect, test */
import { isRunningOnJenkins } from '../../../test-utils'
import { Library, Document, Artboard, Text, SymbolMaster } from '../../'

function findValidLib(libs) {
  return libs.find(l => l.valid)
}

// some tests cannot really run on jenkins because it doesn't have access to MSDocument
if (!isRunningOnJenkins()) {
  test('should list the libraries', () => {
    const libraries = Library.getLibraries()
    expect(libraries[0].type).toBe('Library')
  })

  test('should be able to get the document', () => {
    const libraries = Library.getLibraries()
    const lib = findValidLib(libraries)
    expect(lib.getDocument().type).toBe('Document')
  })

  test('should be able to get the list of symbols to be imported', () => {
    const document = new Document()
    const libraries = Library.getLibraries()
    const lib = findValidLib(libraries)
    expect(lib.getImportableSymbolReferencesForDocument(document)[0].type).toBe(
      'ImportableObject'
    )
    document.close()
  })

  let lib
  let libId

  test('should create a library from a document', () => {
    const document = new Document()

    const artboard = new Artboard({
      name: 'Test',
      parent: document.selectedPage,
    })
    // eslint-disable-next-line
    const text = new Text({
      text: 'Test value',
      parent: artboard,
    })
    // eslint-disable-next-line
    const master = SymbolMaster.fromArtboard(artboard)

    return new Promise((resolve, reject) => {
      document.save('~/Desktop/sketch-api-unit-tests-library.sketch', err => {
        if (err) {
          reject(err)
          return
        }

        document.close()

        lib = Library.getLibraryForDocumentAtPath(
          '~/Desktop/sketch-api-unit-tests-library.sketch'
        )
        libId = lib.id
        expect(lib.type).toBe('Library')

        const libraries = Library.getLibraries()
        expect(libraries.find(d => d.id === libId)).toEqual(lib)
        resolve()
      })
    })
  })

  test('should disabled a library', () => {
    expect(lib.enabled).toBe(true)
    lib.enabled = false
    expect(lib.enabled).toBe(false)
    lib.enabled = true
    expect(lib.enabled).toBe(true)
  })

  test('should get the lastModifiedAt date', () => {
    expect(lib.lastModifiedAt instanceof Date).toBe(true)
  })

  test('should remove a library', () => {
    lib.remove()

    const libraries = Library.getLibraries()
    expect(libraries.find(d => d.id === libId)).toBe(undefined)
  })

  test('should add a remote library', () =>
    new Promise((resolve, reject) => {
      Library.getRemoteLibraryWithRSS(
        'https://client.sketch.cloud/v1/shares/PR8z1/rss',
        (err, result) => {
          if (err) {
            return reject(err)
          }
          return resolve(result)
        }
      )
    }).then(result => {
      expect(result.libraryType).toBe(Library.LibraryType.Remote)
      result.remove()
    }))
}
