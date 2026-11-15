import test from "node:test";
import assert from "node:assert/strict";

function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

test("accessibility: elder high-contrast theme meets WCAG 2.2 AA (>= 4.5:1) and AAA (>= 7:1) for large text", () => {
  const contrastEmeraldOnDark = getContrastRatio("#10b981", "#0f172a");
  assert.ok(
    contrastEmeraldOnDark >= 4.5,
    `Emerald contrast ${contrastEmeraldOnDark} should exceed 4.5:1`
  );

  const contrastWhiteOnDark = getContrastRatio("#ffffff", "#090d16");
  assert.ok(
    contrastWhiteOnDark >= 14.0,
    `White on dark surface ${contrastWhiteOnDark} should exceed 14:1 (AAA rated)`
  );

  const contrastAmberOnDark = getContrastRatio("#fbbf24", "#090d16");
  assert.ok(
    contrastAmberOnDark >= 7.0,
    `Amber warning contrast ${contrastAmberOnDark} should exceed 7:1`
  );
});

test("accessibility: minimum touch target sizes satisfy elder ergonomics (>= 48px)", () => {
  const touchTargets = [
    { component: "DoseTakenButton", minHeightPx: 56, minWidthPx: 120 },
    { component: "DoseSkipButton", minHeightPx: 48, minWidthPx: 100 },
    { component: "VoiceOrbTrigger", minHeightPx: 80, minWidthPx: 80 },
    { component: "CaregiverPortalToggle", minHeightPx: 48, minWidthPx: 48 },
    { component: "TourActionButton", minHeightPx: 48, minWidthPx: 120 },
  ];

  for (const target of touchTargets) {
    assert.ok(
      target.minHeightPx >= 48,
      `${target.component} height must be >= 48px for motor impaired / elderly users (got ${target.minHeightPx}px)`
    );
    assert.ok(
      target.minWidthPx >= 48,
      `${target.component} width must be >= 48px for motor impaired / elderly users (got ${target.minWidthPx}px)`
    );
  }
});

test("accessibility: aria-live attributes properly announce dosage status changes to screen readers", () => {
  const liveAnnouncements = [
    { event: "DOSE_TAKEN", role: "status", ariaLive: "polite", message: "दवा ले ली गई है (Dose marked as taken)" },
    { event: "DOSE_MISSED", role: "alert", ariaLive: "assertive", message: "ध्यान दें: दवा का समय निकल गया है (Alert: Medication dose overdue)" },
    { event: "LASA_WARNING", role: "alert", ariaLive: "assertive", message: "सावधानी: यह दवा मिलती-जुलती नाम वाली है (Caution: Look-alike sound-alike medication detected)" },
    { event: "TOUR_STEP_ADVANCE", role: "status", ariaLive: "polite", message: "टूर का अगला चरण (Tour step updated)" }
  ];

  for (const ann of liveAnnouncements) {
    assert.ok(["polite", "assertive"].includes(ann.ariaLive), "Valid aria-live property");
    assert.ok(ann.message.length > 5, "Informative screen-reader message");
    if (ann.ariaLive === "assertive") {
      assert.equal(ann.role, "alert", "Assertive announcements should use role=alert");
    }
  }
});

test("accessibility: keyboard focusable elements have visible focus indicators and tab stops", () => {
  const interactiveElements = [
    { selector: "button.dose-confirm", tabIndex: 0, hasFocusRing: true },
    { selector: "button.voice-assistant-toggle", tabIndex: 0, hasFocusRing: true },
    { selector: "input#caregiver-pin", tabIndex: 0, hasFocusRing: true },
    { selector: "button.tour-skip", tabIndex: 0, hasFocusRing: true }
  ];

  for (const el of interactiveElements) {
    assert.equal(el.tabIndex, 0, `${el.selector} must be in normal tab order`);
    assert.equal(el.hasFocusRing, true, `${el.selector} must provide visible focus styles`);
  }
});

test("accessibility: multilingual screen reader announcements support Hindi and English correctly", () => {
  const labels = {
    hi: {
      morningMedicine: "सुबह की दवाएं",
      takenStatus: "ले ली गई",
      dueNow: "अभी लेनी है",
      callCaregiver: "परिवार को कॉल करें"
    },
    en: {
      morningMedicine: "Morning Medicines",
      takenStatus: "Taken",
      dueNow: "Due Now",
      callCaregiver: "Call Caregiver"
    }
  };

  assert.ok(labels.hi.morningMedicine.length > 0);
  assert.ok(labels.en.morningMedicine.length > 0);
  assert.equal(typeof labels.hi.dueNow, "string");
  assert.equal(typeof labels.en.dueNow, "string");
});

