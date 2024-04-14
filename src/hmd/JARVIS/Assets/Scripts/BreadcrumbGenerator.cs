using System.Collections.Generic;
using UnityEngine;

public class breadcrumbGenerator : MonoBehaviour
{
    public BreadcrumbManager breadcrumbManager;

    [SerializeField]
    private List<Vector3> positions = new List<Vector3>();

    void Start()
    {
        // Set the breadcrumb positions in the BreadcrumbManager
        breadcrumbManager.SetBreadcrumbPositions(positions);
    }
}
