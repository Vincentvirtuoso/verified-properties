import { LuInfo } from "react-icons/lu";

interface PhotoDraftNoticesProps {
  missingPhotoCount: number;
  photoSaveFailed: boolean;
}

export function PhotoDraftNotices({
  missingPhotoCount,
  photoSaveFailed,
}: PhotoDraftNoticesProps) {
  if (missingPhotoCount === 0 && !photoSaveFailed) return null;

  const noun = missingPhotoCount === 1 ? "photo" : "photos";
  const pronoun = missingPhotoCount === 1 ? "it" : "them";

  return (
    <div className="space-y-3">
      {missingPhotoCount > 0 && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning mt-4"
        >
          <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">
              {missingPhotoCount} {noun} from your draft could not be restored
            </p>
            <p>
              Your browser may have cleared them, for example after clearing
              site data or when storage was full. Add {pronoun} again before you
              submit. A listing needs at least one photo, and the first photo
              becomes the cover.
            </p>
          </div>
        </div>
      )}

      {photoSaveFailed && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">
              Photos are not being saved on this device
            </p>
            <p>
              Photos you add now are kept only in this open tab. If you reload
              or close it, they will be lost. This usually happens in private
              browsing or when browser storage is full or blocked. Finish and
              submit your listing in this tab. If you have to leave, you will
              need to add the photos again when you return.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
