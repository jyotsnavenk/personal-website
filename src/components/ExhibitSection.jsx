import { toEmbedUrl } from '../data/exhibits'
import { getExhibitImages, getExhibitVideo } from '../data/exhibitImages'
import './ExhibitSection.css'

// Renders one project: caption → title → video embed → images.
// Content comes from src/data/exhibits.js; images auto-discover from
// /exhibit-images/<folder>/imgN.jpg (folder defaults to the title).
//
// layout 'split' (for vertical videos): the portrait video sits on the left
// with a 2×2 image grid on the right. Otherwise the video spans full width
// with a row of three images below.
export default function ExhibitSection({ caption, title, video, localVideo, folder, layout }) {
  const embedUrl = toEmbedUrl(video)
  const localVideoUrl = localVideo ? getExhibitVideo(folder || title) : ''
  const isSplit = layout === 'split'
  const images = getExhibitImages(folder || title).slice(0, isSplit ? 4 : 3)

  const videoFrame = (
    <div className={`exhibit-project__video${isSplit ? ' exhibit-project__video--portrait' : ''}`}>
      {localVideoUrl ? (
        // Set muted via ref too — some browsers ignore the muted attribute when
        // deciding whether autoplay is allowed, and block it without this.
        <video
          ref={(el) => el && (el.muted = true)}
          src={localVideoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={`${title} video`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="exhibit-project__placeholder">Add a YouTube or Vimeo URL</div>
      )}
    </div>
  )

  return (
    <section className={`exhibit-project grid${isSplit ? ' exhibit-project--split' : ''}`} aria-label={title}>
      <div className="exhibit-project__content">
        <div className="exhibit-project__heading">
          <span className="exhibit-project__caption">{caption}</span>
          <h2 className="exhibit-project__title">{title}</h2>
        </div>

        {isSplit ? (
          <div className="exhibit-project__split">
            {videoFrame}
            <div className="exhibit-project__grid">
              {images.map((src, i) => (
                <img key={i} src={src} alt={`${title} — image ${i + 1}`} loading="lazy" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {videoFrame}
            <div className="exhibit-project__images">
              {[0, 1, 2].map((i) =>
                images[i] ? (
                  <img key={i} src={images[i]} alt={`${title} — image ${i + 1}`} loading="lazy" />
                ) : (
                  <div key={i} className="exhibit-project__placeholder exhibit-project__placeholder--img">
                    img{i + 1}.jpg
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
