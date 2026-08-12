import { destinations } from '../src/data/destinations';
import fs from 'fs';

interface MigrationReport {
  sourceRecords: number;
  recordsValid: number;
  recordsIncomplete: number;
  recordsInvalid: number;
  countriesToInsert: number;
  universitiesToInsert: number;
  programsToInsert: number;
  featuresToInsert: number;
  duplicatesDetected: number;
  manualReviewRequired: number;
  recordsWithUnknownDegreeLevel: number;
  recordsWithMissingTuition: number;
  recordsWithMissingDuration: number;
  recordsWithMissingIntake: number;
  recordsWithMissingRequirements: number;
  warnings: string[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function dryRun() {
  const report: MigrationReport = {
    sourceRecords: 0,
    recordsValid: 0,
    recordsIncomplete: 0,
    recordsInvalid: 0,
    countriesToInsert: 0,
    universitiesToInsert: 0,
    programsToInsert: 0,
    featuresToInsert: 0,
    duplicatesDetected: 0,
    manualReviewRequired: 0,
    recordsWithUnknownDegreeLevel: 0,
    recordsWithMissingTuition: 0,
    recordsWithMissingDuration: 0,
    recordsWithMissingIntake: 0,
    recordsWithMissingRequirements: 0,
    warnings: [],
  };

  const universitySlugs = new Set<string>();

  for (const dest of destinations) {
    report.sourceRecords++;
    
    // Validate Country
    if (!dest.name || !dest.id) {
      report.recordsInvalid++;
      report.warnings.push(`Invalid destination missing name or id: ${JSON.stringify(dest)}`);
      continue;
    }
    
    report.recordsValid++;
    report.countriesToInsert++;
    const countrySlug = slugify(dest.name); // Deterministic slug based on name, not arbitrary ID
    
    if (dest.whyChoose) {
      report.featuresToInsert += dest.whyChoose.length;
    }

    // Validate Universities
    if (dest.universities) {
      for (const uni of dest.universities) {
        if (!uni.name) {
          report.warnings.push(`University missing name in country ${dest.name}`);
          continue;
        }

        // Deterministic stable identity: country + university
        const slug = slugify(`${countrySlug}-${uni.name}`);
        
        if (universitySlugs.has(slug)) {
          report.duplicatesDetected++;
          report.warnings.push(`Duplicate university name resolved/skipped: ${uni.name} in ${dest.name}`);
          continue; // Ensure stable identity without appending dynamic counters
        }
        
        universitySlugs.add(slug);
        report.universitiesToInsert++;

        // Process pseudo-programs (courses)
        if (dest.courses && dest.courses.length > 0) {
          for (const course of dest.courses) {
            report.programsToInsert++;
            report.recordsIncomplete++; // Programs lack crucial fields
            report.recordsWithUnknownDegreeLevel++;
            report.recordsWithMissingTuition++;
            report.recordsWithMissingDuration++;
            report.recordsWithMissingIntake++;
            report.recordsWithMissingRequirements++;
          }
        } else {
          report.warnings.push(`University ${uni.name} has no courses defined in source data.`);
          report.manualReviewRequired++;
        }
      }
    }
  }

  const reportString = JSON.stringify(report, null, 2);
  console.log('DRY RUN REPORT:');
  console.log(reportString);
  
  fs.writeFileSync('migration-report.json', reportString);
}

dryRun().catch(console.error);
