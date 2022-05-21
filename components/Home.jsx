import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { map } from 'lodash'
import { MParser, MRenderer } from '../lib/mdict'
import localforage from 'localforage'
import $ from '../lib/mdict/jquery-1.11.3.min'
import { fileOpen } from 'browser-fs-access'
import Image from 'next/image'
import { APP_NAME } from '../constants'
import { Definition } from './Definition'
import { useRouter } from 'next/router'
import c from 'classnames'

async function verifyPermission(fileHandle, withWrite) {
  const options = {
    mode: withWrite ? 'readwrite' : 'read',
  }

  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }

  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }

  return false
}

export default function Home() {
  const router = useRouter()
  const { word } = router.query
  const [content, setContent] = useState('')
  const [paths, setPaths] = useState([])
  const [keyword, setKeyword] = useState(decodeURIComponent(word))
  const [dict, setDict] = useState(null)
  const [handles, setHandles] = useState([])
  const [needActivate, setNeedActivate] = useState(true)

  const initDict = (files) => {
    if (files.length > 0) {
      MParser(files)
        .then((resources) => {
          const mdict = MRenderer(resources)
          setDict(mdict)
          $('#dict-title').html(
            (resources['mdx'] || resources['mdd']).value().description ||
            '** no description **'
          )
          mdict.render($('#dict-title'))
        })
        .then(() => {
          setPaths(map(files, (file) => ({ ...file, loaded: true })))
        })
    }
  }

  const handleKeywordChange = (e) => {
    const { value } = e.target
    setKeyword(value)
  }

  const handleSubmit = async () => {
    router.push({ query: { word: keyword } }, undefined, { shallow: false })
  }

  const handleLoadFile = async () => {
    const blobs = await fileOpen({
      multiple: true,
    })
    const handles = await localforage.setItem(
      'DICT_HANDLES',
      map(blobs, 'handle')
    )
    setHandles(handles)
    initDict(blobs)
  }

  const checkCanLoad = async () => {
    let flag = false
    for (let i = 0; i < handles.length; i++) {
      const permission = await handles[i].queryPermission()
      if (permission !== 'granted') {
        flag = true
      }
    }
    setNeedActivate(flag)
  }

  const retriveFiles = async () => {
    if (handles) {
      await checkCanLoad()
      const fileList = await Promise.all(
        handles.map(async (handle) => {
          if (await verifyPermission(handle)) {
            return handle.getFile()
          } else {
            throw new Error('需要权限')
          }
        })
      )

      setNeedActivate(!fileList.length)
      await initDict(fileList)
    }
  }

  const deleteFiles = async () => {
    await localforage.removeItem('DICT_HANDLES')
    setHandles(null)
  }

  // 从 local 读路径 handle
  useEffect(async () => {
    const handles = await localforage.getItem('DICT_HANDLES')
    setHandles(handles)
    return () => { }
  }, [])

  // 根据 handle 读取文件
  useEffect(async () => {
    try {
      await retriveFiles()
    } catch (error) {
      console.log(error)
    }
  }, [handles])

  useEffect(() => {
    const offset = 0

    const phrase = decodeURIComponent(word)

    dict &&
      dict
        .search({ phrase: phrase, max: 5 })
        .then(function (list) {
          return dict.lookup(list[0])
        })
        .then(function ($content) {
          const html = $content.html()
          setContent(html)
          dict.render($('#definition')) // 音频播放使用了事件监听，只能再 render 一次
        })
  }, [word, dict])

  return (
    <div className="App h-screen">
      <nav className="fixed top-0 z-10 grid h-16 w-full grid-cols-4 items-center justify-around border-b border-gray-200 bg-white p-2">
        <a className="mx-10 text-2xl font-bold text-rose-400">{APP_NAME}</a>
        <div className="col-span-3 flex justify-center">
          <input
            className="dark:shadow-sm-light block rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            placeholder="Search..."
            maxLength="32"
            type="text"
            enterKeyHint="go"
            value={keyword}
            onChange={handleKeywordChange}
            onKeyDown={(e) => {
              if (e.code === 'Enter') {
                handleSubmit()
              }
            }}
          />
          <button
            className="mx-2  rounded-lg border border-blue-700 px-5 py-2.5 text-center text-sm font-medium text-blue-700 hover:bg-blue-800 hover:text-white focus:ring-4 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-600 dark:hover:text-white dark:focus:ring-blue-800"
            id="btnLookup"
            onClick={handleSubmit}
            disabled={needActivate}
          >
            look up
          </button>
        </div>
      </nav>
      <div className="grid h-screen grid-cols-4 ">
        <div className="h-screen overflow-y-auto bg-slate-50 px-4 pt-20">
          {handles?.length && (
            <ul className="rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {map(handles, ({ name, loaded }) => (
                <li
                  className="w-full rounded-t-lg border-b border-gray-200 py-2 px-4 dark:border-gray-600"
                  key={name}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {(!handles?.length || needActivate) && (
            <div className="m-5 flex justify-around">
              {!handles?.length && (
                <button
                  className="mr-2 mb-2 rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-blue-500/50 hover:bg-gradient-to-br focus:ring-4 focus:ring-blue-300 dark:shadow-lg dark:shadow-blue-800/80 dark:focus:ring-blue-800"
                  onClick={handleLoadFile}
                >
                  导入词典
                </button>
              )}
              {handles?.length && needActivate && (
                <>
                  <button
                    className="mr-2 mb-2 rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 px-5 py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-indigo-500/50 hover:bg-gradient-to-br focus:ring-4 focus:ring-pink-300 dark:shadow-lg dark:shadow-pink-800/80 dark:focus:ring-pink-800"
                    onClick={retriveFiles}
                  >
                    加载词典
                  </button>
                  <button
                    className="mr-2 mb-2 rounded-lg bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 px-5 py-2.5 text-center text-sm font-medium text-white shadow-lg shadow-pink-500/50 hover:bg-gradient-to-br focus:ring-4 focus:ring-pink-300 dark:shadow-lg dark:shadow-pink-800/80 dark:focus:ring-pink-800"
                    onClick={deleteFiles}
                  >
                    删除词典
                  </button>
                </>
              )}
            </div>
          )}
          <div
            id="dict-title"
            className={c("my-2 max-w-xs rounded-lg border border-gray-200 bg-white p-2 shadow-md", {
              'hidden': !dict
            })}
          />
        </div>

        {content && <Definition content={content} />}
      </div>
    </div>
  )
}
