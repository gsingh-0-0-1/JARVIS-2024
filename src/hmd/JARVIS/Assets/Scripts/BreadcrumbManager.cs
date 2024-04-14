using System.Collections.Generic;
using UnityEngine;

public class BreadcrumbManager : MonoBehaviour
{
    public BreadcrumbGenerator breadcrumbGenerator;

    [SerializeField]
    private List<Vector3> positions = new List<Vector3>();

    void Start()
    {
        // Set the breadcrumb positions in the BreadcrumbManager
        breadcrumbGenerator.SetBreadcrumbPositions(positions);
    }
}
