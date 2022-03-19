import { useRouter } from 'next/router'
import React, { useEffect, useRef } from 'react'

export function Definition({ content }) {
  const router = useRouter()
  const ref = useRef(null)
  function log(e) {
    e.preventDefault()
    const { href } = e.currentTarget

    if (href && href.substring(0, 8) === 'entry://') {
      var word = href.substring(8)
      router.push({ query: { word } }, undefined, { shallow: true })

      // TODO: remove '#' to get jump target
      if (word.charAt(0) !== '#') {
        word = word.replace(/(^[/\\])|([/]$)/, '')
      } else {
        var currentUrl = location.href
        location.href = word //Go to the target element.
        history.replaceState(null, null, currentUrl) //Don't like hashes. Changing it back.
      }
    }
  }
  useEffect(() => {
    if (ref.current) {
      const anchors = ref.current.querySelectorAll('a')
      anchors.forEach((e) => {
        e.addEventListener('click', log)
      })
    }

    return () =>
      ref.current &&
      anchors.forEach((e) => {
        e.removeEventListener('click', log)
      })
  }, [content])

  return (
    <div className="col-span-3 h-screen overflow-y-auto pt-16">
      <div
        ref={ref}
        id="definition"
        dangerouslySetInnerHTML={{ __html: content }}
        className="m-10 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
      />
    </div>
  )
}
