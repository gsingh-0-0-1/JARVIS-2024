using System;
using System.Data;
// Can't use name 'Program' since already exists in the Program.cs file
class EVACoords
{
    // Position Transformation - rotation matrix of (-EVA_Heading)
    static double new_x(double x, double y, double EVA_x, double EVA_y, double EVA_Heading)
    {
        double new_x = Math.Cos(-1 * EVA_Heading) * (x - EVA_x) - Math.Sin(-1 * EVA_Heading) * (y - EVA_y);
        return new_x;
    }
    static double new_y(double x, double y, double EVA_x, double EVA_y, double EVA_Heading)
    {
        double new_y = Math.Sin(-1 * EVA_Heading) * (x - EVA_x) + Math.Cos(-1 * EVA_Heading) * (y - EVA_y);
        return new_y;
    }
    // Orientation Tranformation
    static double new_Heading(double target_Heading, double EVA_Heading)
    {
        double new_Heading = target_Heading - EVA_Heading;
        if (new_Heading < 0)
        {
            new_Heading += Math.PI * 2; // if heading is negative, add 2pi
        }
        return new_Heading;
    }
    // Not converting to 3 decimal places because might use in calculations
    public static double degToRad(double degrees)
    {
        return degrees * Math.PI / 180;
    }
    static double radToDeg(double radians)
    {
        return radians * 180 / Math.PI;
    }
    // Using Main2 instead of Main since using different file w/ Main function
    public static void Main2()
    {
        // EVA coordinates
        double EVA_x = 0;
        double EVA_y = 0;
        double EVA_Heading = 0 * Math.PI / 4;
        // Target coordinates - target can be anything, like to EVA, home base, geological sites of interest, etc
        double target_x = 0;
        double target_y = 0;
        double target_Heading = 0 * Math.PI / 4;
        // Getting inputs
        Console.WriteLine("Enter the EVA Easting: "); // x-coord
        EVA_x = Convert.ToDouble(Console.ReadLine());
        Console.WriteLine("Enter the EVA Northing: "); // y-coord
        EVA_y = Convert.ToDouble(Console.ReadLine());
        Console.WriteLine("Enter the EVA heading (in degrees): ");
        EVA_Heading = Convert.ToDouble(Console.ReadLine());
        EVA_Heading = degToRad(EVA_Heading);
        Console.WriteLine("Enter the target Easting "); // x-coord
        target_x = Convert.ToDouble(Console.ReadLine());
        Console.WriteLine("Enter the target Northing "); // y-coord
        target_y = Convert.ToDouble(Console.ReadLine());
        Console.WriteLine("Enter the target heading (in degrees)");
        target_Heading = Convert.ToDouble(Console.ReadLine());
        target_Heading = degToRad(target_Heading);
        // instantiating new variables here so less cluttered below
        double newXCoord = new_x(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newXCoord == meters to the right of the EVA (negative - left of EVA)
        double newYCoord = new_y(target_x, target_y, EVA_x, EVA_y, EVA_Heading); // newYCoord == meters in front of EVA (negative - behind EVA)
        double heading = radToDeg(new_Heading(target_Heading, EVA_Heading)); // heading == counter-clockwise target orientation relative to EVA (0 - facing same direction)
                                                                             // displaying new target coordinates & heading
        Console.WriteLine($"Relative Target x: {Math.Round(newXCoord, 3)}");
        Console.WriteLine($"Relative Target y: {Math.Round(newYCoord, 3)}");
        Console.WriteLine($"Relative Target orientation: {Math.Round(heading, 3)}");
        // NASA gives UTM - we convert the origin to wherever the EVA is
    }
}



