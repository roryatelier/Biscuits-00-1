import { getSharedProject } from '@/lib/actions/sharing';
import type { SharedFormulation, SharedSampleOrder } from '@/lib/actions/sharing';
import styles from './Share.module.css';

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSharedProject(token);

  if ('error' in result) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>&#128279;</div>
          <h1 className={styles.errorTitle}>
            {result.error === 'expired'
              ? 'This link has expired'
              : result.error === 'revoked'
                ? 'This link has been revoked'
                : 'Link not found'}
          </h1>
          <p className={styles.errorMessage}>
            {result.error === 'expired'
              ? 'The share link you followed is no longer valid. Please request a new link from the project owner.'
              : result.error === 'revoked'
                ? 'This share link has been revoked by the project owner.'
                : 'The link you followed does not exist or has been removed.'}
          </p>
        </div>
        <footer className={styles.footer}>Powered by Atelier</footer>
      </div>
    );
  }

  const { project, includeIngredients, includeReviews } = result;
  const claims: string[] = project.claims
    ? (() => {
        try {
          return JSON.parse(project.claims);
        } catch {
          return [];
        }
      })()
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.statusBadge}>{project.status}</span>
            {project.category && (
              <span className={styles.categoryTag}>{project.category}</span>
            )}
            {project.market && (
              <span className={styles.categoryTag}>{project.market}</span>
            )}
          </div>
          <h1 className={styles.title}>{project.name}</h1>
        </div>

        {/* Claims */}
        {claims.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Claims</h2>
            <div className={styles.claimsList}>
              {claims.map((c: string) => (
                <span key={c} className={styles.claimTag}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Formulations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Formulations ({project.formulations.length})
          </h2>
          {project.formulations.length === 0 ? (
            <p className={styles.emptyText}>No formulations linked.</p>
          ) : (
            <div className={styles.cardList}>
              {project.formulations.map((pf: SharedFormulation, i: number) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardName}>
                      {pf.formulation.name}
                    </span>
                    <span className={styles.cardMeta}>
                      {pf.formulation.category && `${pf.formulation.category} · `}
                      v{pf.formulation.version} · {pf.formulation.status}
                    </span>
                  </div>

                  {includeIngredients && pf.formulation.ingredients.length > 0 && (
                    <div className={styles.ingredientTable}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Ingredient (INCI)</th>
                            <th>CAS</th>
                            <th>Function</th>
                            <th>Role</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pf.formulation.ingredients.map((fi, j) => (
                            <tr key={j}>
                              <td>{fi.ingredient.name}</td>
                              <td>{fi.ingredient.casNumber ?? '\u2014'}</td>
                              <td>{fi.ingredient.function ?? '\u2014'}</td>
                              <td>{fi.role ?? '\u2014'}</td>
                              <td>
                                {fi.percentage != null
                                  ? `${fi.percentage}%`
                                  : '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Orders */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Sample Orders ({project.sampleOrders.length})
          </h2>
          {project.sampleOrders.length === 0 ? (
            <p className={styles.emptyText}>No sample orders.</p>
          ) : (
            <div className={styles.cardList}>
              {project.sampleOrders.map((so: SharedSampleOrder, i: number) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardName}>
                      {so.formulation?.name ?? 'Unknown formulation'}
                    </span>
                    <span
                      className={`${styles.orderStatusBadge} ${
                        so.status === 'Delivered'
                          ? styles.statusDelivered
                          : so.status === 'Pending'
                            ? styles.statusPending
                            : styles.statusActive
                      }`}
                    >
                      {so.status}
                    </span>
                  </div>
                  <p className={styles.cardMeta}>
                    {so.reference} · Qty {so.quantity}
                    {so.format && ` · ${so.format}`}
                  </p>

                  {includeReviews && so.reviews.length > 0 && (
                    <div className={styles.reviewsSection}>
                      <p className={styles.reviewsLabel}>Reviews</p>
                      {so.reviews.map((rev, ri) => (
                        <div key={ri} className={styles.reviewRow}>
                          <div className={styles.reviewScores}>
                            {rev.overall != null && (
                              <span className={styles.reviewScore}>
                                Overall: {rev.overall}/5
                              </span>
                            )}
                            {rev.texture != null && (
                              <span className={styles.reviewScore}>
                                Texture: {rev.texture}/5
                              </span>
                            )}
                            {rev.scent != null && (
                              <span className={styles.reviewScore}>
                                Scent: {rev.scent}/5
                              </span>
                            )}
                            {rev.colour != null && (
                              <span className={styles.reviewScore}>
                                Colour: {rev.colour}/5
                              </span>
                            )}
                          </div>
                          {rev.notes && (
                            <p className={styles.reviewNotes}>{rev.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>Powered by Atelier</footer>
    </div>
  );
}
