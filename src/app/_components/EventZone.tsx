interface EventTagProps {
  zone: ZoneType;
  small?: boolean;
  interactive?: boolean;
  onClickZone?: () => void;
  active?: boolean;
  truncate?: boolean;
}

const EventTag: React.FC<EventTagProps> = ({
  zone,
  small,
  interactive,
  onClickZone,
  active,
}) => {
  const defaultBg = zone.colour as React.CSSProperties["backgroundColor"];

  const backgroundColor = !interactive
    ? defaultBg
    : active
      ? defaultBg
      : "white";

  return (
    <div onClick={onClickZone}>
      <span
        className={`font-brand rounded-full border-2 border-black px-2 py-1 font-semibold whitespace-nowrap text-black transition-all ${
          small ? "text-[0.65rem]" : "text-sm"
        } ${interactive && "cursor-pointer"} ${active && ""}`}
        style={{
          backgroundColor,
          ...(interactive &&
            !active && {
              // use inline hover background simulation
              transition: "background-color 0.2s ease",
            }),

          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
          display: "inline-block",
        }}
        onMouseEnter={(e) => {
          if (interactive && !active) {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              defaultBg ?? "";
          }
        }}
        onMouseLeave={(e) => {
          if (interactive && !active) {
            (e.currentTarget as HTMLElement).style.backgroundColor = "white";
          }
        }}
      >
        {zone.name}
      </span>
    </div>
  );
};

export default EventTag;
