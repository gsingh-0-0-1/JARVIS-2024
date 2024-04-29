using System.Collections.Generic;
using UnityEngine;

public class BreadcrumbGenerator : MonoBehaviour
{
    public GameObject breadcrumbPrefab;
    private List<Vector3> breadcrumbPositions = new List<Vector3>();

    public void SetBreadcrumbPositions(List<Vector3> positions)
    {
        breadcrumbPositions = positions;
        UpdateBreadcrumbs();
    }

    private void UpdateBreadcrumbs()
    {
        foreach (Transform child in transform)
        {
            Destroy(child.gameObject);
        }

        for (int i = 0; i < breadcrumbPositions.Count; i++)
        {
            Vector3 position = breadcrumbPositions[i];
            Quaternion rotation = Quaternion.identity;

            // Calculate rotation towards the next position
            if (i < breadcrumbPositions.Count - 1)
            {
                Vector3 direction = breadcrumbPositions[i + 1] - position;
                rotation = Quaternion.LookRotation(direction, Vector3.up);
            }

            // Rotate 90 degrees around the X-axis
            rotation *= Quaternion.Euler(90, 0, 0);

            GameObject breadcrumb = Instantiate(breadcrumbPrefab, position, rotation);
            breadcrumb.transform.parent = transform;
            Destroy(breadcrumbPrefab);
        }
    }
}
