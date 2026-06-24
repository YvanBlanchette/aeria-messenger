"use client";

type YouTubeEmbedProps = {
  videoId: string;
};

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId }) => {
  return (
    <div className="w-[280px] sm:w-[360px] aspect-video">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title="YouTube video player"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="origin"
        className="w-full h-full border-0 block"
      />
    </div>
  );
};

export default YouTubeEmbed;