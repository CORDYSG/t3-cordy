interface EventTagProps {
  zone: ZoneType;
  small?: boolean;
}

const EventTag: React.FC<EventTagProps> = ({ zone, small }) => {
  return (
    <div>
      <span
        className={`rounded-full border-2 border-black px-2 py-1 font-semibold whitespace-nowrap text-black ${small ? "text-[0.65rem]" : "text-xs"}`}
        style={{
          backgroundColor:
            zone.colour as React.CSSProperties["backgroundColor"],
        }}
      >
        {zone.name}
      </span>
    </div>
  );
};

export default EventTag;
