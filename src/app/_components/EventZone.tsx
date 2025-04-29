interface EventTagProps {
  zone: ZoneType;
  small?: boolean;
  interactive?: boolean;
  onClickZone?: () => void;
}

const EventTag: React.FC<EventTagProps> = ({
  zone,
  small,
  interactive,
  onClickZone,
}) => {
  return (
    <button onClick={onClickZone}>
      <span
        className={`rounded-full border-2 border-black px-2 py-1 font-semibold whitespace-nowrap text-black ${small ? "text-[0.65rem]" : "text-xs"} ${
          interactive &&
          "cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        }`}
        style={{
          backgroundColor:
            zone.colour as React.CSSProperties["backgroundColor"],
        }}
      >
        {zone.name}
      </span>
    </button>
  );
};

export default EventTag;
