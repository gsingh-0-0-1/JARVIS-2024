import numpy as np

'''

FWIW, I'm writing this in one sitting while eating a bar of dark chocolate.
If you want to restructure this, have at it. Just getting some ideas out.
Maybe we won't even write this in Python. Consider this more pseudocode than anything else.

'''

class Point:
	def __init__(self, x, y, z):
		self.loc = np.array([x, y, z])

def parse_geodata(some_args):
	'''
	Turn our data into a bunch of points containing location and elevation.
	'''

	arr = []

	# add Point objects to arr

	return arr

class Topology:
	def __init__(self, points):
		self.points = points
		self.npoints = len(points)

class ShortestPath(Topology):

	'''
	Find the point and set up the priority queue for Dijkstra's
	'''
	def startatpoint(point):
		ind = self.points.index(point)

	'''
	Calculate cost between two points. May not be simple distance
	due to increased priority of elevation.

	We can implement different costs to test different pathfinding optimalities / outcomes.	
	'''
	def cost_function(p1, p2):
		euclid_2d = np.sqrt((p1.loc[0] - p2.loc[0]) ** 2 + (p1.loc[1] - p2.loc[1]) ** 2)
		elev_diff = np.abs(p2.loc[2] - p1.loc[2])

		# some edge cases
		
		max_elev_diff_thresh = 100 # dummy number

		# unacceptable elevation difference
		if elev_diff > max_elev_diff_thresh:
			return np.inf

		# default 50-50 weighting of traverse distance and elevation change
		traverse_elev_weights = np.array([0.5, 0.5])

		cost = np.sum(np.array([euclid_2d, elev_diff]) * traverse_elev_weights)

	def dijkstra(self):
		self.dist = np.zeros(self.npoints)
		self.next = np.zeros(self.npoints)
		self.prev = np.zeros(self.npoints)

		# implement dijkstra's using self.cost_function



