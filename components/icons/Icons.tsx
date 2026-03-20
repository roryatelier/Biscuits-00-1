/* All SVG icons extracted from live Atelier platform DOM */

interface IconProps {
  className?: string;
  size?: number;
}

/* ── ATELIER Wordmark (160×20) ─────────────────────────── */
export function AtelierLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 160 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M24.873 2.61544H27.8273L30.2169 2.00835L30.7957 2.3119V19.7587H34.0606V2.3119L34.6041 2.00835L36.8101 2.61544H39.7644V0.00354004H24.873V2.61544Z" fill="black" />
      <path d="M97.6853 2.67897H98.9948L100.802 2.06835L101.381 2.3719V17.3868L100.802 17.6904L98.9948 17.0833H97.6853V19.7587H108.345V17.0833H107.035L105.225 17.6904L104.646 17.3868V2.3719L105.225 2.06835L107.035 2.67897H108.345V0.00354004H97.6853V2.67897Z" fill="black" />
      <path d="M79.7514 17.7715L78.6854 17.1786V0.00354004H75.4241V19.7587H88.1306V16.875H87.0435L79.7514 17.7715Z" fill="black" />
      <path d="M120.977 19.7587H133.684V16.875H132.596L125.304 17.7715L124.238 17.1786V11.0335H132.596V8.42163H124.238V2.58367L125.304 1.98717L132.596 2.88722H133.684V0.00354004H120.977V19.7587Z" fill="black" />
      <path d="M50.3918 19.7587H63.0984V16.875H62.0113L54.7191 17.7715L53.6532 17.1786V11.0335H62.0113V8.42163H53.6532V2.58367L54.7191 1.98717L62.0113 2.88722H63.0984V0.00354004H50.3918V19.7587Z" fill="black" />
      <path d="M6.25797 0.00354004L0 18.2374V19.7552H3.23311L3.79079 16.1409H12.9042L13.6278 19.7552H16.8538V18.2374L10.5958 0.00354004H6.2615H6.25797ZM13.9207 12.9466L11.8983 13.7266H4.97673L2.93662 12.9466V12.4065L6.55093 11.0124L8.11101 2.61544H8.74987L10.31 11.0124L13.9243 12.4065V12.9466H13.9207Z" fill="black" />
      <path d="M156.887 13.9137L154.416 11.8842V11.1288C156.506 10.8147 159.46 9.78757 159.46 5.86619C159.46 1.94481 156.594 0 151.155 0H145.042V19.7552H148.306V11.3971H151.455L157.423 19.7552H160V18.2374L156.887 13.9137ZM148.31 8.95106V2.38601H151.522C154.638 2.38601 156.199 3.49077 156.199 5.66853C156.199 7.84629 154.638 8.95106 151.522 8.95106H148.31Z" fill="black" />
    </svg>
  );
}

/* ── Atelier "A" Avatar Badge (31×31, blue bg + white A) ── */
export function AtelierABadge({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <mask id="mask0_a" maskUnits="userSpaceOnUse" x="0" y="0" width="31" height="31">
        <path d="M30.9062 0.801758H0.90625V30.8018H30.9062V0.801758Z" fill="white" />
      </mask>
      <g mask="url(#mask0_a)">
        <path d="M27.9066 30.8018H3.90595C2.24886 30.8018 0.90625 29.4592 0.90625 27.8021V3.80146C0.90625 2.14436 2.24886 0.801758 3.90595 0.801758H27.9066C29.5636 0.801758 30.9062 2.14436 30.9062 3.80146V27.8021C30.9062 29.4592 29.5636 30.8018 27.9066 30.8018Z" fill="#2563eb" />
        <path d="M14.43 9.80176L10.4062 21.3384V22.3018H12.4854L13.2559 20.0137H18.4171L19.1632 22.3018H21.2301V21.3384L17.2186 9.80176H14.43ZM18.5394 16.9188L18.9186 17.7497L17.3286 18.3639H14.3567L13.8674 18.1712L12.7789 17.7497L13.1581 16.9188L14.0509 17.1356L15.066 14.9318L15.4941 11.8851H16.1545L16.5826 14.9439L17.6222 17.1356L18.5517 16.9068L18.5394 16.9188Z" fill="white" />
      </g>
    </svg>
  );
}

/* ── Home / Dashboard Icon ─────────────────────────────── */
export function HomeIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8.94757 17.0393V12.236H12.8606V17.0393C12.8606 17.5677 13.3008 18 13.8388 18H16.7736C17.3116 18 17.7518 17.5677 17.7518 17.0393V10.3146H19.4149C19.8649 10.3146 20.0801 9.76704 19.7377 9.47884L11.5595 2.24497C11.1878 1.91834 10.6204 1.91834 10.2486 2.24497L2.07045 9.47884C1.73785 9.76704 1.94328 10.3146 2.39328 10.3146H4.05631V17.0393C4.05631 17.5677 4.49652 18 5.03456 18H7.96932C8.50736 18 8.94757 17.5677 8.94757 17.0393Z" fill="black" />
    </svg>
  );
}

/* ── Sparkle / Innovation Projects Icon ────────────────── */
export function SparkleIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_sparkle)">
        <path d="M1.11625 5.29557L3.56042 6.096L4.36083 8.54024C4.40354 8.66191 4.52 8.75024 4.65625 8.75024C4.7925 8.75024 4.90896 8.66233 4.95146 8.54024L5.75208 6.096L8.19625 5.29557C8.31792 5.25286 8.40625 5.1366 8.40625 5.00035C8.40625 4.86409 8.31833 4.74742 8.19625 4.70513L5.75208 3.90469L4.95125 1.46025C4.90854 1.33858 4.79229 1.25024 4.65604 1.25024C4.51979 1.25024 4.40313 1.33816 4.36063 1.46025L3.56021 3.90448L1.11625 4.70513C0.994583 4.74784 0.90625 4.86409 0.90625 5.00035C0.90625 5.1366 0.994167 5.25327 1.11625 5.29557Z" fill="black" />
        <path d="M6.32625 11.8409L11.2146 13.4417L12.8154 18.3301C12.9008 18.5734 13.1338 18.7501 13.4062 18.7501C13.6788 18.7501 13.9117 18.5742 13.9967 18.3301L15.5979 13.4417L20.4863 11.8409C20.7296 11.7555 20.9062 11.523 20.9062 11.2505C20.9062 10.978 20.7304 10.7447 20.4863 10.6601L15.5979 9.05924L13.9963 4.17049C13.9108 3.92715 13.6783 3.75049 13.4058 3.75049C13.1333 3.75049 12.9 3.92632 12.815 4.17049L11.2142 9.05882L6.32625 10.6601C6.08292 10.7455 5.90625 10.978 5.90625 11.2505C5.90625 11.523 6.08208 11.7563 6.32625 11.8409Z" fill="black" />
      </g>
      <defs>
        <clipPath id="clip0_sparkle"><rect width="20" height="20" fill="white" transform="translate(0.90625)" /></clipPath>
      </defs>
    </svg>
  );
}

/* ── Location Pin / Sample Tracking Icon ───────────────── */
export function LocationPinIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16.9062 6.39322V6.22372C16.9062 2.68889 13.8497 -0.131914 10.2356 0.260094C7.1668 0.592851 4.90625 3.30641 4.90625 6.39322C4.90625 7.75925 5.24226 9.10428 5.88527 10.3096L10.9332 19.7766C11.7367 18.1694 13.0277 15.7467 13.0277 15.7467L15.9275 10.3096C16.5702 9.10428 16.9062 7.75925 16.9062 6.39322ZM10.9061 8.84877C9.45635 8.84877 8.28107 7.6735 8.28107 6.22372C8.28107 4.77394 9.45635 3.59866 10.9061 3.59866C12.3559 3.59866 13.5312 4.77394 13.5312 6.22372C13.5312 7.6735 12.3559 8.84877 10.9061 8.84877Z" fill="black" />
    </svg>
  );
}

/* ── Checkmark / Approved Icon ─────────────────────────── */
export function CheckmarkIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 25 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5.70703 10.8999L9.90703 15.0999L20.107 4.8999" stroke="black" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Chevron Down ──────────────────────────────────────── */
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16.9062 7L10.9062 13L4.90625 7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Chevron Up ────────────────────────────────────────── */
export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4.90625 13L10.9063 7L16.9062 13" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Sidebar Close (vertical bar + left chevron) ───────── */
export function SidebarCloseIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5.90625 4L5.90625 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.9062 4L9.90625 10L15.9062 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Sidebar Open (vertical bar + right chevron) ───────── */
export function SidebarOpenIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5.90625 4L5.90625 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.90625 4L15.9062 10L9.90625 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Attachment / Link Icon ────────────────────────────── */
export function LinkIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.055 13.2715C3.055 12.2729 3.45167 11.3153 4.15774 10.6092L5.74776 9.01921C6.04722 8.71974 6.53276 8.71974 6.83223 9.01921C7.1317 9.31868 7.1317 9.80422 6.83223 10.1037L5.24221 11.6937C4.82376 12.1122 4.58867 12.6797 4.58867 13.2715C4.58867 13.8633 4.82376 14.4308 5.24221 14.8493C5.66067 15.2677 6.22821 15.5028 6.82 15.5028C7.41178 15.5028 7.97933 15.2677 8.39778 14.8493L9.9878 13.2593C10.2873 12.9598 10.7728 12.9598 11.0723 13.2593C11.3717 13.5587 11.3717 14.0443 11.0723 14.3437L9.48225 15.9337C8.77618 16.6398 7.81854 17.0365 6.82 17.0365C5.82146 17.0365 4.86381 16.6398 4.15774 15.9337C3.45167 15.2277 3.055 14.27 3.055 13.2715ZM8.92779 6.92365C8.62832 6.62418 8.62832 6.13865 8.92779 5.83918L10.5178 4.24917C11.2239 3.54309 12.1815 3.14642 13.1801 3.14642C14.1786 3.14642 15.1362 3.54309 15.8423 4.24917C16.5484 4.95524 16.9451 5.91288 16.9451 6.91142C16.9451 7.90996 16.5484 8.86761 15.8423 9.57368L14.2523 11.1637C13.9528 11.4632 13.4673 11.4632 13.1678 11.1637C12.8684 10.8642 12.8684 10.3787 13.1678 10.0792L14.7578 8.48921C15.1763 8.07075 15.4114 7.50321 15.4114 6.91142C15.4114 6.31964 15.1763 5.75209 14.7578 5.33364C14.3394 4.91518 13.7718 4.6801 13.1801 4.6801C12.5883 4.6801 12.0207 4.91518 11.6023 5.33364L10.0123 6.92365C9.71279 7.22312 9.22726 7.22312 8.92779 6.92365ZM7.33777 12.7537C7.0383 12.4542 7.0383 11.9687 7.33777 11.6692L11.5778 7.4292C11.8773 7.12973 12.3628 7.12973 12.6623 7.4292C12.9618 7.72867 12.9618 8.2142 12.6623 8.51367L8.42224 12.7537C8.12278 13.0532 7.63724 13.0532 7.33777 12.7537Z" fill="black" />
    </svg>
  );
}

/* ── Send Arrow Up ─────────────────────────────────────── */
export function SendIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12.9062 6.23975V19.1997" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18.4264 10.3205L13.7548 5.64882C13.2861 5.18019 12.5264 5.18019 12.0577 5.64882L7.38608 10.3205" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── Green Checkmark Circle (order confirmation) ───────── */
export function GreenCheckCircleIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="xMidYMid meet">
      <path d="M23.5 12C23.5 18.3513 18.3513 23.5 12 23.5C5.64873 23.5 0.5 18.3513 0.5 12C0.5 5.64873 5.64873 0.5 12 0.5C18.3513 0.5 23.5 5.64873 23.5 12Z" fill="#57CCA6" stroke="#57CCA6" strokeMiterlimit="10" />
      <path d="M6 12.75L9.5 16.25L18 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Formulation Icon (chemical/molecule, #D4D4D4) ─────── */
export function FormulationIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 43 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_form)">
        <path d="M3.86684 22.0623C2.71009 23.2852 1.99609 24.9309 1.99609 26.747C1.99609 30.5162 5.05124 33.5717 8.82039 33.5717C12.5895 33.5717 15.3689 30.7755 15.6198 27.2349C11.0159 27.5874 6.62834 25.5682 3.86684 22.0623Z" fill="#D4D4D4" />
        <path d="M42.6718 22.8103C41.4804 17.6488 36.6725 14.2633 31.5429 14.7109C30.7739 14.7788 29.9784 14.566 29.3232 14.0519C28.6519 13.5255 28.2532 12.781 28.1468 11.9974C28.0887 11.5168 28.0047 11.0345 27.8931 10.5522C26.1973 3.20747 18.869 -1.37193 11.5243 0.323822C4.17988 2.01957 -0.399515 9.34822 1.29623 16.6933C1.76383 18.7181 2.66088 20.5314 3.86698 22.0623C5.11089 20.7474 6.86753 19.9224 8.82053 19.9224C12.5893 19.9224 15.6448 22.9779 15.6448 26.7471C15.6448 26.9119 15.6315 27.0733 15.6203 27.235C16.2986 27.1832 16.9818 27.0799 17.6654 26.9221C18.0199 26.8402 18.3678 26.745 18.7091 26.6375C19.4563 26.4279 20.2823 26.4937 21.0236 26.8832C21.7313 27.2549 22.2388 27.8583 22.5024 28.5513C22.5202 28.6038 22.5388 28.6556 22.5573 28.7074C22.5615 28.7207 22.5664 28.7337 22.5706 28.747V28.7452C24.3483 33.6757 29.571 36.6104 34.8049 35.4022C40.4546 34.0978 43.977 28.4603 42.6729 22.8103H42.6718Z" fill="#D4D4D4" />
        <path d="M35.0661 11.523C37.6753 11.523 39.7904 9.40773 39.7904 6.79838C39.7904 4.18903 37.6753 2.07373 35.0661 2.07373C32.4569 2.07373 30.3418 4.18903 30.3418 6.79838C30.3418 9.40773 32.4569 11.523 35.0661 11.523Z" fill="#D4D4D4" />
        <path d="M25.0917 37.7779C25.097 35.4585 23.2211 33.574 20.9019 33.5687C18.5827 33.5635 16.6984 35.4395 16.6931 37.7589C16.6879 40.0783 18.5637 41.9628 20.8829 41.968C23.2021 41.9733 25.0864 40.0973 25.0917 37.7779Z" fill="#D4D4D4" />
      </g>
      <defs>
        <clipPath id="clip0_form"><rect width="42" height="42" fill="white" transform="translate(0.90625)" /></clipPath>
      </defs>
    </svg>
  );
}

/* ── Packaging Icon (#D4D4D4) ──────────────────────────── */
export function PackagingIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 43 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_pkg)">
        <path d="M42.6953 40.5318L36.2213 34.0579C35.9063 33.7429 35.479 33.5658 35.0334 33.5658H28.1164L25.5883 36.5782C24.3955 37.9996 22.2763 38.1851 20.8546 36.9923L16.7708 33.5654H8.84957C8.40402 33.5654 7.97667 33.7425 7.66167 34.0575L1.18737 40.5318C0.859419 40.8598 0.859419 41.3918 1.18737 41.7197C1.35152 41.8839 1.56642 41.9658 1.78132 41.9658H42.1013C42.3162 41.9658 42.5311 41.8839 42.6953 41.7197C43.0232 41.3918 43.0232 40.8598 42.6953 40.5318Z" fill="#D4D4D4" />
        <path d="M23.7414 8.15631C23.5003 7.02196 22.3852 6.29781 21.2505 6.53896L15.9361 7.66876C16.8041 6.59881 17.2003 5.16136 16.8916 3.70851C16.3491 1.15631 13.8399 -0.472943 11.2874 0.0699068C8.73482 0.612407 7.10557 3.12156 7.64842 5.67411C7.95712 7.12696 8.90422 8.27846 10.1324 8.90286L4.81797 10.0327C3.68362 10.2738 2.95947 11.3889 3.20062 12.5233L5.60267 23.8206C5.84382 24.9549 6.95892 25.6791 8.09362 25.4379L17.4092 23.4573L25.0571 14.3433L23.7414 8.15631Z" fill="#D4D4D4" />
        <path d="M38.817 20.8135C40.0098 19.3921 39.8243 17.2725 38.403 16.0797L37.7597 15.5397L40.4592 12.3225C40.832 11.8783 40.7739 11.2161 40.3297 10.8434L37.1122 8.14381C36.668 7.77106 36.0055 7.82916 35.6327 8.27331L32.9332 11.4905L32.2899 10.9505C30.8682 9.75766 28.7489 9.94316 27.5561 11.3645L25.0568 14.343L26.1432 19.4534C26.3843 20.5877 25.6602 21.7028 24.5258 21.9443L17.4086 23.4574L14.3272 27.1296C13.1344 28.5509 13.3199 30.6705 14.7412 31.863L16.7705 33.5657H28.1161L38.8167 20.8135H38.817Z" fill="#D4D4D4" />
      </g>
      <defs>
        <clipPath id="clip0_pkg"><rect width="42" height="42" fill="white" transform="translate(0.90625)" /></clipPath>
      </defs>
    </svg>
  );
}

/* ── Sample Order / Bar Chart Icon (#D4D4D4) ───────────── */
export function SampleOrderIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 43 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_sample)">
        <path d="M42.6425 40.5532L36.1686 34.0792C35.8536 33.7642 35.4262 33.5871 34.9807 33.5871H33.4382V37.7871H29.2382V33.5871H27.1382V37.7871H22.9382V33.5871H20.8382V6.28711H16.6382V33.5871H20.8382V37.7871H16.6382V33.5871H14.5382V20.9871H10.3382V33.5871H14.5382V37.7871H10.3382V33.5871H8.79683C8.35128 33.5871 7.92393 33.7642 7.60893 34.0792L1.13463 40.5532C0.806684 40.8811 0.806684 41.4131 1.13463 41.7411C1.29878 41.9052 1.51368 41.9871 1.72858 41.9871H42.0486C42.2635 41.9871 42.4784 41.9052 42.6425 41.7411C42.9705 41.4131 42.9705 40.8811 42.6425 40.5532Z" fill="#D4D4D4" />
        <path d="M22.9375 10.4871H27.1375V33.5871H22.9375V10.4871Z" fill="#D4D4D4" />
        <path d="M29.2383 2.08716H33.4383V33.5872H29.2383V2.08716Z" fill="#D4D4D4" />
      </g>
      <defs>
        <clipPath id="clip0_sample"><rect width="42" height="42" fill="white" transform="translate(0.90625)" /></clipPath>
      </defs>
    </svg>
  );
}

/* ── Plus / New Icon ───────────────────────────────────── */
export function PlusIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10.9062 4V16" stroke="black" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.90625 10H16.9062" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 16c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 16c0-2.21 1.343-4 3-4s3 1.79 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Hamburger Menu Icon ─────────────────────────────────── */
export function HamburgerIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Beaker Icon (quick action) ──────────────────────────── */
export function BeakerIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 2v5.5L3.5 16a2 2 0 002 2h9a2 2 0 002-2L12 7.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8.5" cy="14" r="1" fill="currentColor" />
      <circle cx="11.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

/* ── Box Icon (quick action) ─────────────────────────────── */
export function BoxIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 6l8-4 8 4-8 4-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 6v8l8 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 6v8l-8 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Clipboard Icon (quick action) ───────────────────────── */
export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="4" y="3" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h6M7 11h4M7 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentsIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M11.667 1.667H5a1.667 1.667 0 00-1.667 1.666v13.334A1.667 1.667 0 005 18.333h10a1.667 1.667 0 001.667-1.666V6.667l-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.667 1.667v5h5M13.333 10.833H6.667M13.333 14.167H6.667M8.333 7.5H6.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Sparkle Tool Icon (small, for tool panel header) ──── */
export function SparkleToolIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 1l.894 2.106L7 4l-2.106.894L4 7l-.894-2.106L1 4l2.106-.894L4 1z" fill="currentColor" />
      <path d="M10 6l1.5 3.5L15 11l-3.5 1.5L10 16l-1.5-3.5L5 11l3.5-1.5L10 6z" fill="currentColor" />
    </svg>
  );
}

/* ── Arrow Up-Right (tool card action) ────────────────── */
export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Close / X Icon ───────────────────────────────────── */
export function CloseIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Search Icon ──────────────────────────────────────── */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Building / Suppliers Icon ──────────────────────────── */
export function BuildingIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 18V4a1 1 0 011-1h6a1 1 0 011 1v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8h5a1 1 0 011 1v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 6h1M5.5 9h1M5.5 12h1M8.5 6h1M8.5 9h1M8.5 12h1M13.5 11h1M13.5 14h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.167 12.5a1.375 1.375 0 00.275 1.517l.05.05a1.667 1.667 0 11-2.359 2.358l-.05-.05a1.375 1.375 0 00-1.516-.275 1.375 1.375 0 00-.834 1.258v.142a1.667 1.667 0 01-3.333 0v-.075a1.375 1.375 0 00-.9-1.258 1.375 1.375 0 00-1.517.275l-.05.05a1.667 1.667 0 11-2.358-2.359l.05-.05a1.375 1.375 0 00.275-1.516 1.375 1.375 0 00-1.258-.834h-.142a1.667 1.667 0 010-3.333h.075a1.375 1.375 0 001.258-.9 1.375 1.375 0 00-.275-1.517l-.05-.05A1.667 1.667 0 115.892 3.55l.05.05a1.375 1.375 0 001.516.275h.067a1.375 1.375 0 00.833-1.258v-.142a1.667 1.667 0 013.334 0v.075a1.375 1.375 0 00.833 1.258 1.375 1.375 0 001.517-.275l.05-.05a1.667 1.667 0 112.358 2.358l-.05.05a1.375 1.375 0 00-.275 1.517v.067a1.375 1.375 0 001.258.833h.142a1.667 1.667 0 010 3.334h-.075a1.375 1.375 0 00-1.258.833z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
